import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AccountType } from 'src/types';
import convertCountryToLedger from 'src/common/helpers/convertCountryToLedger.helper';
import convertCountryToCurrency from 'src/common/helpers/convertCountryToCurrency.helper';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name, {
    timestamp: true,
  });
  constructor(
    private readonly prismaService: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  async createUser(dto: CreateUserDto) {
    try {
      const userWithAccount = await this.prismaService.$transaction(
        async (tx) => {
          const user = await tx.user.create({
            data: {
              email: dto.email,
              fullName: dto.fullName,
              phone: dto.phone,
              country: dto.country,
            },
          });

          const tbAccId = await this.ledgerService.createAccount({
            ledger: convertCountryToLedger(user.country),
            code: AccountType.USER_WALLET,
          });

          if (!tbAccId) {
            throw new Error('Failed to create tiger beetle account');
          }

          const pgUserAcc = await tx.userAccount.create({
            data: {
              userId: user.id,
              tigerBeetleAccountId: tbAccId as bigint,
              currency: convertCountryToCurrency(user.country),
              accountType: AccountType[AccountType.USER_WALLET],
            },
          });

          return {
            user,
            userAccount: pgUserAcc,
          };
        },
      );

      return userWithAccount;
    } catch (error) {
      this.logger.error('Failed to create user:', error);

      if (error.code === 'P2002') {
        throw new ConflictException('A user with this email already exists');
      }

      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findUser(id: string) {
    try {
      return await this.prismaService.user.findUniqueOrThrow({
        where: { id },
      });
    } catch {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }
}
