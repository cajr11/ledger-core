import { Module } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [LedgerModule, PrismaModule],
  providers: [TransfersService],
  controllers: [TransfersController],
})
export class TransfersModule {}
