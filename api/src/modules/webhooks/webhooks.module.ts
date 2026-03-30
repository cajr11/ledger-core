import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { ProviderModule } from '../providers/provider.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [ProviderModule, PrismaModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
