import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { RedisService } from '../redis/redis.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { FundAccountDto } from './dto/fund-account.dto';
import { Decimal } from '@prisma/client/runtime/client';
import { AccountType, Ledger, TransferStatus, TransferType } from 'src/types';
import { UpdateTransferStatusDto } from './dto/update-transfer-status.dto';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

const IDEMPOTENCY_TTL_SECONDS = 86400; // 24 hours
const IDEMPOTENCY_KEY_PREFIX = 'idempotency:';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name, {
    timestamp: true,
  });

  constructor(
    private readonly prismaService: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly redisService: RedisService,
  ) {}

  async createTransfer(dto: CreateTransferDto) {
    try {
      // idempotency check Redis (before hitting DB)
      const idempotencyKey = `${IDEMPOTENCY_KEY_PREFIX}${dto.idempotencyKey}`;
      const existingTransferId = await this.redisService.get(idempotencyKey);

      if (existingTransferId) {
        const existing = await this.prismaService.transfer.findUnique({
          where: { id: existingTransferId },
        });
        if (existing) return existing;
      }

      // validate accounts exist
      const transfer = await this.prismaService.$transaction(async (tx) => {
        const sender = await tx.userAccount.findFirst({
          where: {
            userId: dto.senderId,
            currency: dto.senderCurrency,
          },
        });

        if (!sender) {
          throw new BadRequestException(
            `Cannot make transfer from an invalid account`,
          );
        }

        // validate sender balance
        const account = await this.ledgerService.getAccountBalance(
          BigInt(sender.tigerBeetleAccountId.toFixed(0)),
        );
        const balance = new Decimal(account.balance);

        if (balance.lessThan(dto.amount)) {
          throw new BadRequestException('Insufficient balance');
        }

        const recipient = await tx.userAccount.findFirst({
          where: {
            userId: dto.recipientId,
            currency: dto.recipientCurrency,
          },
        });

        if (!recipient) {
          throw new BadRequestException(
            `Cannot make transfer to an invalid account`,
          );
        }

        if (dto.senderCurrency === dto.recipientCurrency) {
          // same currency transfer in DB first
          const pgTransfer = await tx.transfer.create({
            data: {
              idempotencyKey: dto.idempotencyKey,
              senderId: dto.senderId,
              recipientId: dto.recipientId,
              amount: dto.amount,
              senderCurrency: dto.senderCurrency,
              recipientCurrency: dto.recipientCurrency,
            },
          });

          // record initial status
          await tx.transferStatusHistory.create({
            data: {
              transferId: pgTransfer.id,
              fromStatus: null,
              toStatus: TransferStatus.INITIATED,
              changedBy: 'system',
            },
          });

          // create transfer in Tiger Beetle
          await this.ledgerService.createTransfer({
            debitAccountId: BigInt(sender.tigerBeetleAccountId.toFixed(0)),
            creditAccountId: BigInt(recipient.tigerBeetleAccountId.toFixed(0)),
            amount: BigInt(pgTransfer.amount.toFixed(0)), // store in smallest unit (centavos)
            ledger: Ledger[pgTransfer.senderCurrency as keyof typeof Ledger],
            code: TransferType.TRANSFER,
          });

          // update status
          await this.updateTransferStatus(
            tx,
            pgTransfer.id,
            pgTransfer.status as TransferStatus,
            {
              toStatus: TransferStatus.COMPLETED,
              changedBy: 'system',
            },
          );

          return pgTransfer;
        }
      });

      // store idempotency key and transfer ID in Redis
      if (transfer) {
        await this.redisService.set(
          idempotencyKey,
          transfer.id,
          IDEMPOTENCY_TTL_SECONDS,
        );
      }

      return transfer;
    } catch (error) {
      this.logger.error('Transaction Creation Failure:', error);
      throw error;
    }
  }

  async fundAccount(dto: FundAccountDto) {
    try {
      const fundingAccount = await this.prismaService.systemAccount.findFirst({
        where: {
          currency: dto.currency,
          accountType: AccountType[AccountType.FUNDING_SOURCE],
        },
      });

      if (!fundingAccount) {
        throw new BadRequestException(
          `No funding account exists for currency ${dto.currency}`,
        );
      }

      const userAccount = await this.prismaService.userAccount.findFirst({
        where: {
          userId: dto.userId,
          currency: dto.currency,
        },
      });

      if (!userAccount) {
        throw new BadRequestException(
          `User does not have a ${dto.currency} wallet`,
        );
      }

      await this.ledgerService.createTransfer({
        debitAccountId: BigInt(fundingAccount.tigerBeetleAccountId.toFixed(0)),
        creditAccountId: BigInt(userAccount.tigerBeetleAccountId.toFixed(0)),
        amount: BigInt(dto.amount),
        ledger: Ledger[dto.currency as keyof typeof Ledger],
        code: TransferType.FUNDING,
      });

      const balance = await this.ledgerService.getAccountBalance(
        BigInt(userAccount.tigerBeetleAccountId.toFixed(0)),
      );

      return balance;
    } catch (error) {
      this.logger.error('Funding failure:', error);
      throw error;
    }
  }

  async getTransfer(id: string) {
    try {
      return await this.prismaService.transfer.findUniqueOrThrow({
        where: { id },
      });
    } catch {
      throw new NotFoundException(`Transfer with id ${id} not found`);
    }
  }

  async getTransferHistory(transferId: string) {
    const transfer = await this.prismaService.transfer.findUnique({
      where: { id: transferId },
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer with id ${transferId} not found`);
    }

    return await this.prismaService.transferStatusHistory.findMany({
      where: { transferId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateTransferStatus(
    tx: TransactionClient,
    transferId: string,
    currentStatus: TransferStatus,
    dto: UpdateTransferStatusDto,
  ) {
    await tx.transferStatusHistory.create({
      data: {
        transferId: transferId,
        fromStatus: currentStatus,
        ...dto,
      },
    });

    await tx.transfer.update({
      where: { id: transferId },
      data: { status: dto.toStatus },
    });
  }
}
