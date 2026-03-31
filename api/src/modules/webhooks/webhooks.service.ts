import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  mapProviderStatus,
  mapToTransferStatus,
} from '../providers/payment-provider-adapter.interface';
import { canTransition, TransferStatus } from 'src/types';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async handleProviderEvent(payload: {
    event: string;
    provider_ref: string;
    status: string;
    reference_id: string;
    timestamp: string;
  }) {
    // Look up the transfer
    const transfer = await this.prismaService.transfer.findUnique({
      where: { id: payload.reference_id },
    });

    if (!transfer) {
      this.logger.warn(
        `No transfer found for reference_id: ${payload.reference_id}`,
      );
      return { received: true, matched: false };
    }

    // Map statuses
    const providerStatus = mapProviderStatus(payload.status);
    const newTransferStatus = mapToTransferStatus(
      providerStatus,
      transfer.status as TransferStatus,
    );

    // Store raw event in provider_events
    await this.prismaService.providerEvent.create({
      data: {
        transferId: transfer.id,
        provider: 'stub',
        eventType: payload.event,
        rawStatus: payload.status,
        mappedStatus: newTransferStatus,
        rawPayload: payload,
      },
    });

    // Skip update if status hasn't changed
    if (transfer.status === newTransferStatus) {
      this.logger.log(
        `Status unchanged: ${newTransferStatus}, skipping update`,
      );
      return { received: true, matched: true, statusChanged: false };
    }

    // Validate transition
    if (!canTransition(transfer.status, newTransferStatus)) {
      this.logger.warn(
        `Invalid transition: ${transfer.status} -> ${newTransferStatus}, rejecting`,
      );
      return { received: true, matched: true, statusChanged: false, invalidTransition: true };
    }

    // Update transfer status and record history
    await this.prismaService.$transaction(async (tx) => {
      await tx.transferStatusHistory.create({
        data: {
          transferId: transfer.id,
          fromStatus: transfer.status,
          toStatus: newTransferStatus,
          changedBy: `webhook:${payload.provider_ref}`,
        },
      });

      await tx.transfer.update({
        where: { id: transfer.id },
        data: { status: newTransferStatus },
      });
    });

    this.logger.log(
      `Transfer ${transfer.id}: ${transfer.status} -> ${newTransferStatus}`,
    );

    return { received: true, matched: true, statusChanged: true };
  }
}
