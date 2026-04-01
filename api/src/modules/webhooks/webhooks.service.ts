import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemporalService } from '../temporal/temporal.service';
import {
  mapProviderStatus,
  mapToTransferStatus,
} from '../providers/payment-provider-adapter.interface';
import { canTransition, TransferStatus } from '@ledger-core/shared';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly temporalService: TemporalService,
  ) {}

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

    // Store raw event in provider_events (always, even if we don't act on it)
    await this.prismaService.providerEvent.create({
      data: {
        transferId: transfer.id,
        provider: 'stub',
        eventType: payload.event,
        rawStatus: payload.status,
        mappedStatus: payload.status,
        rawPayload: payload,
      },
    });

    // For cross-border transfers, signal the Temporal workflow
    if (transfer.type === 'CROSS_BORDER') {
      await this.temporalService.signalProviderStatus(
        transfer.id,
        payload.status,
      );
      this.logger.log(
        `Signaled workflow for transfer ${transfer.id} with status: ${payload.status}`,
      );
      return { received: true, matched: true, signaled: true };
    }

    // For non-workflow transfers, update directly (same-currency fallback)
    const providerStatus = mapProviderStatus(payload.status);
    const newTransferStatus = mapToTransferStatus(
      providerStatus,
      transfer.status as TransferStatus,
    );

    if (transfer.status === newTransferStatus) {
      return { received: true, matched: true, statusChanged: false };
    }

    if (!canTransition(transfer.status, newTransferStatus)) {
      this.logger.warn(
        `Invalid transition: ${transfer.status} -> ${newTransferStatus}`,
      );
      return { received: true, matched: true, invalidTransition: true };
    }

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
