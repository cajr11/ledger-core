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

  // Listen for webhook signals
  setHandler(providerStatusSignal, (status: string) => {
    providerStatus = status;
  });

  try {
    //  Debit sender and move to pool
    await debitSenderToPool(input);

    //  Collect fee
    await collectFee(input);

    // Update status to COLLECTING
    await updateTransferStatus({
      transferId: input.transferId,
      fromStatus: TransferStatus.INITIATED,
      toStatus: TransferStatus.COLLECTING,
      changedBy: 'workflow',
    });

    //  Initiate on-ramp with provider
    await initiateOnRamp(input);

    //Wait for provider webhook (funds_received or failure)
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
        fromStatus: TransferStatus.COLLECTING,
        toStatus: TransferStatus.FUNDS_RECEIVED,
        changedBy: 'workflow',
      });
    } else {
      throw ApplicationFailure.nonRetryable(
        `Provider returned: ${providerStatus}`,
      );
    }

    // Reset for next signal
    providerStatus = null;

    //  Update to CONVERTING (conversion happens via provider)
    await updateTransferStatus({
      transferId: input.transferId,
      fromStatus: TransferStatus.FUNDS_RECEIVED,
      toStatus: TransferStatus.CONVERTING,
      changedBy: 'workflow',
    });

    // Update to SENDING
    await updateTransferStatus({
      transferId: input.transferId,
      fromStatus: TransferStatus.CONVERTING,
      toStatus: TransferStatus.SENDING,
      changedBy: 'workflow',
    });

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
        fromStatus: TransferStatus.SENDING,
        toStatus: TransferStatus.COMPLETED,
        changedBy: 'workflow',
      });
    } else {
      throw ApplicationFailure.nonRetryable(
        `Off-ramp provider returned: ${providerStatus}`,
      );
    }
  } catch (error) {
    //  mark transfer as failed
    const currentTransfer = input;
    await markTransferFailed({
      transferId: currentTransfer.transferId,
      currentStatus: TransferStatus.INITIATED,
      reason: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
