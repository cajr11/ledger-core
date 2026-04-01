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
import { TemporalService } from '../temporal/temporal.service';
import { FEE_RATE, TransferStatus } from '@ledger-core/shared';
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
    private readonly temporalService: TemporalService,
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

      // Validate sender account and balance
      const senderAccount = await this.prismaService.userAccount.findFirst({
        where: { userId: dto.senderId, currency: dto.senderCurrency },
      });

      if (!senderAccount) {
        throw new BadRequestException(
          `Sender does not have a ${dto.senderCurrency} wallet`,
        );
      }

      const balance = await this.ledgerService.getAccountBalance(
        BigInt(senderAccount.tigerBeetleAccountId.toFixed(0)),
      );

      if (new Decimal(balance.balance).lessThan(dto.amount)) {
        throw new BadRequestException('Insufficient balance');
      }

      // Create transfer record in Postgres
      const transfer = await this.prismaService.$transaction(async (tx) => {
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

      // Store idempotency key
      await this.redisService.set(
        idempotencyKey,
        transfer.id,
        IDEMPOTENCY_TTL_SECONDS,
      );

      // Start Temporal workflow (handles debit, fee, provider calls, webhook waits)
      const workflowId = await this.temporalService.startCrossBorderTransfer({
        transferId: transfer.id,
        senderId: dto.senderId,
        senderCurrency: dto.senderCurrency,
        recipientCurrency: dto.recipientCurrency,
        amount: dto.amount,
        exchangeRate: rate,
        fee: feeAmount,
        amountAfterFee,
        convertedAmount: convertedAmountAfterFee,
      });

      this.logger.log(
        `Cross-border transfer ${transfer.id} started workflow ${workflowId}`,
      );

      return {
        ...transfer,
        workflowId,
      };
    } catch (error) {
      this.logger.error('Cross-border transfer failure:', error);
      throw error;
    }
  }
}
