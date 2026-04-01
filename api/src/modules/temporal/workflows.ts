import {
  proxyActivities,
  defineSignal,
  setHandler,
  condition,
  ApplicationFailure,
} from '@temporalio/workflow';
import type { Activities, CrossBorderInput } from './activities';
import { TransferStatus } from '@ledger-core/shared';

const {
  debitSenderToPool,
  collectFee,
  initiateOnRamp,
  updateTransferStatus,
  markTransferFailed,
  reverseFee,
  refundSenderFromPool,
} = proxyActivities<Activities>({
  startToCloseTimeout: '30 seconds',
  retry: { maximumAttempts: 3 },
});

// Signals that webhooks send to the workflow
export const providerStatusSignal = defineSignal<[string]>('providerStatus');

export async function crossBorderTransferWorkflow(
  input: CrossBorderInput,
): Promise<void> {
  let providerStatus: string | null = null;
  let currentStatus = TransferStatus.INITIATED;

  // Listen for webhook signals
  setHandler(providerStatusSignal, (status: string) => {
    providerStatus = status;
  });

  try {
    // Debit sender and move to pool
    await debitSenderToPool(input);

    // Collect fee
    await collectFee(input);

    // Update status to COLLECTING
    await updateTransferStatus({
      transferId: input.transferId,
      fromStatus: currentStatus,
      toStatus: TransferStatus.COLLECTING,
      changedBy: 'workflow',
    });
    currentStatus = TransferStatus.COLLECTING;

    // Initiate on-ramp with provider
    await initiateOnRamp(input);

    // Wait for provider webhook
    await condition(() => providerStatus !== null, '10 minutes');

    if (!providerStatus) {
      throw ApplicationFailure.nonRetryable(
        'On-ramp timed out waiting for provider',
      );
    }

    if (
      providerStatus === 'payment_processed' ||
      providerStatus === 'funds_received'
    ) {
      await updateTransferStatus({
        transferId: input.transferId,
        fromStatus: currentStatus,
        toStatus: TransferStatus.FUNDS_RECEIVED,
        changedBy: 'workflow',
      });
      currentStatus = TransferStatus.FUNDS_RECEIVED;
    } else {
      throw ApplicationFailure.nonRetryable(
        `Provider returned: ${providerStatus}`,
      );
    }

    // Reset for next signal
    providerStatus = null;

    // Update to CONVERTING
    await updateTransferStatus({
      transferId: input.transferId,
      fromStatus: currentStatus,
      toStatus: TransferStatus.CONVERTING,
      changedBy: 'workflow',
    });
    currentStatus = TransferStatus.CONVERTING;

    // Update to SENDING
    await updateTransferStatus({
      transferId: input.transferId,
      fromStatus: currentStatus,
      toStatus: TransferStatus.SENDING,
      changedBy: 'workflow',
    });
    currentStatus = TransferStatus.SENDING;

    // Wait for final provider confirmation
    await condition(() => providerStatus !== null, '10 minutes');

    if (!providerStatus) {
      throw ApplicationFailure.nonRetryable(
        'Off-ramp timed out waiting for provider',
      );
    }

    if (providerStatus === 'payment_processed') {
      await updateTransferStatus({
        transferId: input.transferId,
        fromStatus: currentStatus,
        toStatus: TransferStatus.COMPLETED,
        changedBy: 'workflow',
      });
    } else {
      throw ApplicationFailure.nonRetryable(
        `Off-ramp provider returned: ${providerStatus}`,
      );
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error';

    // mark as failed from whatever state we're in
    await markTransferFailed({
      transferId: input.transferId,
      currentStatus,
      reason,
    });

    await updateTransferStatus({
      transferId: input.transferId,
      fromStatus: TransferStatus.FAILED,
      toStatus: TransferStatus.REFUNDING,
      changedBy: 'workflow:compensation',
    });

    // reverse the money movement in TigerBeetle
    await reverseFee(input);
    await refundSenderFromPool(input);

    await updateTransferStatus({
      transferId: input.transferId,
      fromStatus: TransferStatus.REFUNDING,
      toStatus: TransferStatus.REFUNDED,
      changedBy: 'workflow:compensation',
    });
  }
}
