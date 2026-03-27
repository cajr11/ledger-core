import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { LedgerService } from './modules/ledger/ledger.service';

@Module({
  imports: [HealthModule, LedgerModule],
  controllers: [AppController],
  providers: [AppService, LedgerService],
})
export class AppModule {}
