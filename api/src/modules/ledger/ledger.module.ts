import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { SystemAccountsService } from './system-accounts.service';
import { SystemAccountsController } from './system-accounts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LedgerService, SystemAccountsService],
  controllers: [SystemAccountsController],
  exports: [LedgerService, SystemAccountsService],
})
export class LedgerModule {}
