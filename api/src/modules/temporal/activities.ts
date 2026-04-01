import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { PaymentProvider } from '../providers/payment-provider-adapter.interface';
import {
  AccountType,
  FEE_RATE,
  Ledger,
  TransferStatus,
  TransferType,
} from '@ledger-core/shared';
import { Decimal } from '@prisma/client/runtime/client';

export type CrossBorderInput = {
  transferId: string;
  senderId: string;
  senderCurrency: string;
  recipientCurrency: string;
  amount: string;
  exchangeRate: string;
  fee: string;
  amountAfterFee: string;
  convertedAmount: string;
};

export function createActivities(
  prisma: PrismaService,
  ledger: LedgerService,
  provider: PaymentProvider,
) {
  return {
    async debitSenderToPool(input: CrossBorderInput): Promise<void> {
      const senderAccount = await prisma.userAccount.findFirst({
        where: { userId: input.senderId, currency: input.senderCurrency },
      });

      const pool = await prisma.systemAccount.findFirst({
        where: {
          currency: input.senderCurrency,
          accountType: AccountType[AccountType.INTERNAL_POOL],
        },
      });

      if (!senderAccount || !pool) {
        throw new Error('Sender account or pool not found');
      }

      await ledger.createTransfer({
        debitAccountId: BigInt(senderAccount.tigerBeetleAccountId.toFixed(0)),
        creditAccountId: BigInt(pool.tigerBeetleAccountId.toFixed(0)),
        amount: BigInt(input.amount),
        ledger: Ledger[input.senderCurrency as keyof typeof Ledger],
        code: TransferType.TRANSFER,
      });
    },

    async collectFee(input: CrossBorderInput): Promise<void> {
      const pool = await prisma.systemAccount.findFirst({
        where: {
          currency: input.senderCurrency,
          accountType: AccountType[AccountType.INTERNAL_POOL],
        },
      });

      const feeAccount = await prisma.systemAccount.findFirst({
        where: {
          currency: input.senderCurrency,
          accountType: AccountType[AccountType.FEE_COLLECTION],
        },
      });

      if (!pool || !feeAccount) {
        throw new Error('Pool or fee account not found');
      }

      await ledger.createTransfer({
        debitAccountId: BigInt(pool.tigerBeetleAccountId.toFixed(0)),
        creditAccountId: BigInt(feeAccount.tigerBeetleAccountId.toFixed(0)),
        amount: BigInt(input.fee),
        ledger: Ledger[input.senderCurrency as keyof typeof Ledger],
        code: TransferType.FEE,
      });
    },

    async initiateOnRamp(input: CrossBorderInput): Promise<string> {
      const result = await provider.initiateOnRamp({
        amount: input.amount,
        currency: input.senderCurrency,
        referenceId: input.transferId,
      });

      await prisma.transfer.update({
        where: { id: input.transferId },
        data: { providerRef: result.providerRef },
      });

      return result.providerRef;
    },

    async updateTransferStatus(params: {
      transferId: string;
      fromStatus: string;
      toStatus: string;
      changedBy: string;
    }): Promise<void> {
      await prisma.$transaction(async (tx) => {
        await tx.transferStatusHistory.create({
          data: {
            transferId: params.transferId,
            fromStatus: params.fromStatus,
            toStatus: params.toStatus,
            changedBy: params.changedBy,
          },
        });

        await tx.transfer.update({
          where: { id: params.transferId },
          data: { status: params.toStatus },
        });
      });
    },

    async markTransferFailed(params: {
      transferId: string;
      currentStatus: string;
      reason: string;
    }): Promise<void> {
      await prisma.$transaction(async (tx) => {
        await tx.transferStatusHistory.create({
          data: {
            transferId: params.transferId,
            fromStatus: params.currentStatus,
            toStatus: TransferStatus.FAILED,
            changedBy: 'system',
            metadata: { reason: params.reason },
          },
        });

        await tx.transfer.update({
          where: { id: params.transferId },
          data: {
            status: TransferStatus.FAILED,
            failureReason: params.reason,
          },
        });
      });
    },

    // Compensation, reverse the fee collection
    async reverseFee(input: CrossBorderInput): Promise<void> {
      const feeAccount = await prisma.systemAccount.findFirst({
        where: {
          currency: input.senderCurrency,
          accountType: AccountType[AccountType.FEE_COLLECTION],
        },
      });

      const pool = await prisma.systemAccount.findFirst({
        where: {
          currency: input.senderCurrency,
          accountType: AccountType[AccountType.INTERNAL_POOL],
        },
      });

      if (!feeAccount || !pool) return;

      await ledger.createTransfer({
        debitAccountId: BigInt(feeAccount.tigerBeetleAccountId.toFixed(0)),
        creditAccountId: BigInt(pool.tigerBeetleAccountId.toFixed(0)),
        amount: BigInt(input.fee),
        ledger: Ledger[input.senderCurrency as keyof typeof Ledger],
        code: TransferType.REFUND,
      });
    },

    // Compensation: reverse the pool debit back to sender
    async refundSenderFromPool(input: CrossBorderInput): Promise<void> {
      const senderAccount = await prisma.userAccount.findFirst({
        where: { userId: input.senderId, currency: input.senderCurrency },
      });

      const pool = await prisma.systemAccount.findFirst({
        where: {
          currency: input.senderCurrency,
          accountType: AccountType[AccountType.INTERNAL_POOL],
        },
      });

      if (!senderAccount || !pool) return;

      await ledger.createTransfer({
        debitAccountId: BigInt(pool.tigerBeetleAccountId.toFixed(0)),
        creditAccountId: BigInt(senderAccount.tigerBeetleAccountId.toFixed(0)),
        amount: BigInt(input.amount),
        ledger: Ledger[input.senderCurrency as keyof typeof Ledger],
        code: TransferType.REFUND,
      });
    },
  };
}

export type Activities = ReturnType<typeof createActivities>;
