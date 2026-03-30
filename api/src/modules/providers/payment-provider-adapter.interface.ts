import { TransferStatus } from 'src/types';

export interface ProviderTransferResult {
  providerRef: string; // the provider's ID for this transfer
  status: ProviderStatus; // mapped to a generic set of options
  rawStatus: string; // the original status string from the provider
  rawPayload?: Record<string, any>; // the full original response (for auditing)
}

export enum ProviderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  REQUIRES_ACTION = 'REQUIRES_ACTION', // needs manual intervention
}

export interface PaymentProvider {
  initiateOnRamp(params: {
    amount: string;
    currency: string;
    referenceId: string;
  }): Promise<ProviderTransferResult>;

  initiateOffRamp(params: {
    amount: string;
    currency: string;
    destinationId: string;
    referenceId: string;
  }): Promise<ProviderTransferResult>;

  getTransferStatus(providerRef: string): Promise<ProviderTransferResult>;

  getExchangeRate(from: string, to: string): Promise<{ rate: string }>;
}

export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export function mapProviderStatus(rawStatus: string): ProviderStatus {
  switch (rawStatus) {
    case 'awaiting_funds':
    case 'in_review':
      return ProviderStatus.PENDING;

    // Provider has funds, actively processing
    case 'funds_received':
    case 'payment_submitted':
      return ProviderStatus.PROCESSING;

    case 'payment_processed':
      return ProviderStatus.COMPLETED;

    case 'undeliverable':
    case 'error':
    case 'canceled':
      return ProviderStatus.FAILED;

    case 'returned':
    case 'refunded':
      return ProviderStatus.REFUNDED;

    case 'refund_failed':
    case 'missing_return_policy':
      return ProviderStatus.REQUIRES_ACTION;

    case 'refund_in_flight':
      return ProviderStatus.PROCESSING;

    default:
      return ProviderStatus.REQUIRES_ACTION;
  }
}

export function mapToTransferStatus(
  providerStatus: ProviderStatus,
  currentStatus: TransferStatus,
): TransferStatus {
  switch (providerStatus) {
    case ProviderStatus.PENDING:
      return TransferStatus.COLLECTING;
    case ProviderStatus.PROCESSING:
      // If we were refunding, stay in refunding
      if (currentStatus === TransferStatus.REFUNDING)
        return TransferStatus.REFUNDING;
      return TransferStatus.FUNDS_RECEIVED;
    case ProviderStatus.COMPLETED:
      return TransferStatus.COMPLETED;
    case ProviderStatus.FAILED:
      return TransferStatus.FAILED;
    case ProviderStatus.REFUNDED:
      return TransferStatus.REFUNDED;
    case ProviderStatus.REQUIRES_ACTION:
      return TransferStatus.FAILED; // flag for manual review
  }
}
