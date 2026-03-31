import { Module } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CrossBorderTransferService } from './cross-border-transfer.service';
import { TransfersController } from './transfers.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProviderModule } from '../providers/provider.module';

@Module({
  imports: [LedgerModule, PrismaModule, ProviderModule.register()],
  providers: [TransfersService, CrossBorderTransferService],
  controllers: [TransfersController],
})
export class TransfersModule {}
