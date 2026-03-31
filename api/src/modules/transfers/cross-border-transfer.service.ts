import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import {
  PaymentProvider,
  PAYMENT_PROVIDER,
} from '../providers/payment-provider-adapter.interface';
import { AccountType, Ledger, TransferStatus, TransferType } from 'src/types';
import { Decimal } from '@prisma/client/runtime/client';

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
  ) {}

  async createTransfer(dto: {
    idempotencyKey: string;
    senderId: string;
    senderCurrency: string;
    recipientCurrency: string;
    amount: string;
    recipientDetails: Record<string, any>;
  }) {
    try {
      const transfer = await this.prismaService.$transaction(async (tx) => {
        // 1. Validate sender account exists
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

        // 2. Validate sender balance
        const balance = await this.ledgerService.getAccountBalance(
          BigInt(senderAccount.tigerBeetleAccountId.toFixed(0)),
        );

        if (new Decimal(balance.balance).lessThan(dto.amount)) {
          throw new BadRequestException('Insufficient balance');
        }

        // 3. Get exchange rate
        const { rate } = await this.paymentProvider.getExchangeRate(
          dto.senderCurrency,
          dto.recipientCurrency,
        );
        const convertedAmount = new Decimal(dto.amount)
          .mul(rate)
          .toFixed(0);

        // 4. Move funds from sender wallet to pool in TigerBeetle
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

        await this.ledgerService.createTransfer({
          debitAccountId: BigInt(senderAccount.tigerBeetleAccountId.toFixed(0)),
          creditAccountId: BigInt(senderPool.tigerBeetleAccountId.toFixed(0)),
          amount: BigInt(dto.amount),
          ledger: Ledger[dto.senderCurrency as keyof typeof Ledger],
          code: TransferType.TRANSFER,
        });

        // 5. Create transfer record
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
            convertedAmount,
            status: TransferStatus.INITIATED,
          },
        });

        // 6. Record initial status
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

      // 7. Initiate on-ramp with provider (outside transaction - async flow)
      const providerResult = await this.paymentProvider.initiateOnRamp({
        amount: dto.amount,
        currency: dto.senderCurrency,
        referenceId: transfer.id,
      });

      // 8. Store provider ref and update status to COLLECTING
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
