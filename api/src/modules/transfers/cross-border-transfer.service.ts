import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { RedisService } from '../redis/redis.service';
import {
  PaymentProvider,
  PAYMENT_PROVIDER,
} from '../providers/payment-provider-adapter.interface';
import { QuotesService } from '../quotes/quotes.service';
import {
  AccountType,
  FEE_RATE,
  Ledger,
  TransferStatus,
  TransferType,
} from 'src/types';
import { Decimal } from '@prisma/client/runtime/client';

const IDEMPOTENCY_TTL_SECONDS = 86400;
const IDEMPOTENCY_KEY_PREFIX = 'idempotency:';

@Injectable()
export class CrossBorderTransferService {
  private readonly logger = new Logger(CrossBorderTransferService.name, {
    timestamp: true,
  });

  constructor(
    private readonly prismaService: PrismaService,
    private readonly ledgerService: LedgerService,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProvider,
    private readonly quotesService: QuotesService,
    private readonly redisService: RedisService,
  ) {}

  async createTransfer(dto: {
    idempotencyKey: string;
    senderId: string;
    senderCurrency: string;
    recipientCurrency: string;
    amount: string;
    recipientDetails: Record<string, any>;
    quoteId?: string;
  }) {
    try {
      // Redis idempotency check
      const idempotencyKey = `${IDEMPOTENCY_KEY_PREFIX}${dto.idempotencyKey}`;
      const existingTransferId = await this.redisService.get(idempotencyKey);

      if (existingTransferId) {
        const existing = await this.prismaService.transfer.findUnique({
          where: { id: existingTransferId },
        });
        if (existing) return existing;
      }

      const transfer = await this.prismaService.$transaction(async (tx) => {
        // Validate sender account exists
        const senderAccount = await tx.userAccount.findFirst({
          where: {
            userId: dto.senderId,
            currency: dto.senderCurrency,
          },
        });

        if (!senderAccount) {
          throw new BadRequestException(
            `Sender does not have a ${dto.senderCurrency} wallet`,
          );
        }

        // Validate sender balance
        const balance = await this.ledgerService.getAccountBalance(
          BigInt(senderAccount.tigerBeetleAccountId.toFixed(0)),
        );

        if (new Decimal(balance.balance).lessThan(dto.amount)) {
          throw new BadRequestException('Insufficient balance');
        }

        // Get rate from quote (locked) or fetch a new one
        let rate: string;
        let feeAmount: string;
        let amountAfterFee: string;
        let convertedAmountAfterFee: string;

        if (dto.quoteId) {
          const quote = await this.quotesService.consumeQuote(dto.quoteId);
          rate = quote.exchangeRate;
          feeAmount = quote.fee;
          amountAfterFee = quote.amountAfterFee;
          convertedAmountAfterFee = quote.convertedAmount;
        } else {
          const result = await this.paymentProvider.getExchangeRate(
            dto.senderCurrency,
            dto.recipientCurrency,
          );
          rate = result.rate;
          feeAmount = new Decimal(dto.amount).mul(FEE_RATE).toFixed(0);
          amountAfterFee = new Decimal(dto.amount).sub(feeAmount).toFixed(0);
          convertedAmountAfterFee = new Decimal(amountAfterFee)
            .mul(rate)
            .toFixed(0);
        }

        // Look up pool account
        const senderPool = await tx.systemAccount.findFirst({
          where: {
            currency: dto.senderCurrency,
            accountType: AccountType[AccountType.INTERNAL_POOL],
          },
        });

        if (!senderPool) {
          throw new BadRequestException(
            `No pool account for ${dto.senderCurrency}`,
          );
        }

        // Move full amount from sender wallet to pool
        await this.ledgerService.createTransfer({
          debitAccountId: BigInt(senderAccount.tigerBeetleAccountId.toFixed(0)),
          creditAccountId: BigInt(senderPool.tigerBeetleAccountId.toFixed(0)),
          amount: BigInt(dto.amount),
          ledger: Ledger[dto.senderCurrency as keyof typeof Ledger],
          code: TransferType.TRANSFER,
        });

        // Deduct fee from pool to fee collection account
        const feeAccount = await tx.systemAccount.findFirst({
          where: {
            currency: dto.senderCurrency,
            accountType: AccountType[AccountType.FEE_COLLECTION],
          },
        });

        if (!feeAccount) {
          throw new BadRequestException(
            `No fee account for ${dto.senderCurrency}`,
          );
        }

        await this.ledgerService.createTransfer({
          debitAccountId: BigInt(senderPool.tigerBeetleAccountId.toFixed(0)),
          creditAccountId: BigInt(feeAccount.tigerBeetleAccountId.toFixed(0)),
          amount: BigInt(feeAmount),
          ledger: Ledger[dto.senderCurrency as keyof typeof Ledger],
          code: TransferType.FEE,
        });

        // Create transfer record
        const pgTransfer = await tx.transfer.create({
          data: {
            idempotencyKey: dto.idempotencyKey,
            type: 'CROSS_BORDER',
            senderId: dto.senderId,
            recipientDetails: dto.recipientDetails,
            senderCurrency: dto.senderCurrency,
            recipientCurrency: dto.recipientCurrency,
            amount: dto.amount,
            exchangeRate: rate,
            convertedAmount: convertedAmountAfterFee,
            fee: feeAmount,
            status: TransferStatus.INITIATED,
          },
        });

        //  Record initial status
        await tx.transferStatusHistory.create({
          data: {
            transferId: pgTransfer.id,
            fromStatus: null,
            toStatus: TransferStatus.INITIATED,
            changedBy: 'system',
          },
        });

        return pgTransfer;
      });

      // Initiate on-ramp with provider (outside transaction - async flow)
      const providerResult = await this.paymentProvider.initiateOnRamp({
        amount: dto.amount,
        currency: dto.senderCurrency,
        referenceId: transfer.id,
      });

      // Store provider ref and update status to COLLECTING
      await this.prismaService.$transaction(async (tx) => {
        await tx.transfer.update({
          where: { id: transfer.id },
          data: {
            providerRef: providerResult.providerRef,
            status: TransferStatus.COLLECTING,
          },
        });

        await tx.transferStatusHistory.create({
          data: {
            transferId: transfer.id,
            fromStatus: TransferStatus.INITIATED,
            toStatus: TransferStatus.COLLECTING,
            changedBy: 'system',
          },
        });
      });

      // Store idempotency key -> transfer ID in Redis
      await this.redisService.set(
        idempotencyKey,
        transfer.id,
        IDEMPOTENCY_TTL_SECONDS,
      );

      this.logger.log(
        `Cross-border transfer ${transfer.id} initiated: ${dto.amount} ${dto.senderCurrency} -> ${dto.recipientCurrency}`,
      );

      return {
        ...transfer,
        status: TransferStatus.COLLECTING,
        providerRef: providerResult.providerRef,
      };
    } catch (error) {
      this.logger.error('Cross-border transfer failure:', error);
      throw error;
    }
  }
}
