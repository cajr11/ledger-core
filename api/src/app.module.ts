import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { LedgerService } from './modules/ledger/ledger.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    HealthModule,
    LedgerModule,
    UsersModule,
    ConfigModule.forRoot({
      envFilePath: '../.env',
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, LedgerService],
})
export class AppModule {}
