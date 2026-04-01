import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TemporalModule } from '../temporal/temporal.module';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [PrismaModule, TemporalModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
