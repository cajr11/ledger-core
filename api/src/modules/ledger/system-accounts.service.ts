import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from './ledger.service';
import { AccountType, Ledger } from 'src/types';
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class SystemAccountsService {
  private readonly logger = new Logger(SystemAccountsService.name, {
    timestamp: true,
  });

  constructor(
    private readonly prismaService: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  async createFundingAccount(currency: string) {
    try {
      const ledger = Ledger[currency as keyof typeof Ledger];

      if (ledger === undefined) {
        throw new Error(`Unsupported currency: ${currency}`);
      }

      const tbAccId = await this.ledgerService.createAccount({
        ledger,
        code: AccountType.FUNDING_SOURCE,
      });

      if (!tbAccId) {
        throw new Error('Failed to create TigerBeetle funding account');
      }

      const systemAccount = await this.prismaService.systemAccount.create({
        data: {
          tigerBeetleAccountId: new Decimal(tbAccId.toString()),
          currency,
          accountType: AccountType[AccountType.FUNDING_SOURCE],
        },
      });

      return systemAccount;
    } catch (error) {
      this.logger.error('Failed to create funding account:', error);

      if (error.code === 'P2002') {
        throw new ConflictException(
          `A funding account for ${currency} already exists`,
        );
      }

      throw new InternalServerErrorException(
        'Failed to create funding account',
      );
    }
  }

  async getFundingAccounts() {
    return await this.prismaService.systemAccount.findMany();
  }

  async getFundingAccountByCurrency(currency: string) {
    return await this.prismaService.systemAccount.findUnique({
      where: { currency },
    });
  }
}
