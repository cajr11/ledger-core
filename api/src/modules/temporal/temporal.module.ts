import { Module } from '@nestjs/common';
import { TemporalService } from './temporal.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';
import { ProviderModule } from '../providers/provider.module';

@Module({
  imports: [PrismaModule, LedgerModule, ProviderModule.register()],
  providers: [TemporalService],
  exports: [TemporalService],
})
export class TemporalModule {}
