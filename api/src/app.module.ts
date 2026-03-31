import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { TransfersModule } from './modules/transfers/transfers.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [
    RedisModule,
    HealthModule,
    LedgerModule,
    UsersModule,
    TransfersModule,
    WebhooksModule,
    QuotesModule,
    ConfigModule.forRoot({
      envFilePath: '../.env',
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
