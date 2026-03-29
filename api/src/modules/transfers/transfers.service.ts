import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { Decimal } from '@prisma/client/runtime/client';
import { Ledger, TransferStatus, TransferType } from 'src/types';
import { UpdateTransferStatusDto } from './dto/update-transfer-status.dto';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name, {
    timestamp: true,
  });

  constructor(
    private readonly prismaService: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  async createTransfer(dto: CreateTransferDto) {
    try {
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
              currency: dto.senderCurrency,
            },
          });

          // create transfer in Tiger Beetle
          await this.ledgerService.createTransfer({
            debitAccountId: BigInt(sender.tigerBeetleAccountId.toFixed(0)),
            creditAccountId: BigInt(recipient.tigerBeetleAccountId.toFixed(0)),
            amount: BigInt(pgTransfer.amount.toFixed(0)), // store in smallest unit (centavos)
            ledger: Ledger[pgTransfer.currency],
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

      return transfer;
    } catch (error) {
      this.logger.error('Transaction Creation Failure:', error);
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
