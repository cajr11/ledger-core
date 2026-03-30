import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  ProviderStatus,
  ProviderTransferResult,
} from './payment-provider-adapter.interface';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class StubProviderService implements PaymentProvider {
  private readonly logger = new Logger('StubProvider');

  constructor(private httpService: HttpService) {}

  async initiateOnRamp({
    amount,
    currency,
    referenceId,
  }): Promise<ProviderTransferResult> {
    const providerRef = `stub-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.logger.log(`[STUB] Deposit initiated: ${amount} ${currency}`);

    // Simulate async processing with webhook
    const delayMs = parseInt(process.env.STUB_DELAY_MS || '3000', 10);
    const successRate = parseFloat(process.env.STUB_SUCCESS_RATE || '0.9');

    setTimeout(async () => {
      const succeeded = Math.random() < successRate;
      const webhookUrl =
        process.env.STUB_WEBHOOK_URL ||
        'http://localhost:3000/webhooks/provider';

      // Simulate multiple state transitions like a real provider
      try {
        // receive funds with initial delay
        await this.httpService.axiosRef.post(webhookUrl, {
          event: 'transfer.status_updated',
          provider_ref: providerRef,
          status: 'funds_received',
          reference_id: referenceId,
          timestamp: new Date().toISOString(),
        });

        // another delay and final result
        setTimeout(async () => {
          await this.httpService.axiosRef.post(webhookUrl, {
            event: 'transfer.status_updated',
            provider_ref: providerRef,
            status: succeeded ? 'payment_processed' : 'undeliverable',
            reference_id: referenceId,
            timestamp: new Date().toISOString(),
          });
        }, delayMs);
      } catch (err) {
        this.logger.error(`[STUB] Webhook failed: ${err.message}`);
      }
    }, delayMs);

    return {
      providerRef,
      status: ProviderStatus.PENDING,
      rawStatus: 'awaiting_funds',
      rawPayload: { stub: true, amount, currency, referenceId },
    };
  }

  async getExchangeRate(from: string, to: string): Promise<{ rate: string }> {
    const rates: Record<string, number> = {
      MXN_USD: 0.057,
      USD_MXN: 17.5,
      NGN_USD: 0.000645,
      USD_NGN: 1550,
      GHS_USD: 0.062,
      USD_GHS: 16.1,
      COP_USD: 0.00024,
      USD_COP: 4150,
    };
    const key = `${from}_${to}`;
    const baseRate = rates[key] || 1;
    // Add slight variance to simulate real market conditions
    const jitter = 1 + (Math.random() * 0.04 - 0.02);
    return { rate: (baseRate * jitter).toFixed(6) };
  }

  async initiateOffRamp({
    amount,
    currency,
    destinationId,
    referenceId,
  }): Promise<ProviderTransferResult> {
    const providerRef = `stub-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.logger.log(
      `[STUB] Withdrawal initiated: ${amount} ${currency} to ${destinationId}`,
    );

    const delayMs = parseInt(process.env.STUB_DELAY_MS || '3000', 10);
    const successRate = parseFloat(process.env.STUB_SUCCESS_RATE || '0.9');

    setTimeout(async () => {
      const succeeded = Math.random() < successRate;
      const webhookUrl =
        process.env.STUB_WEBHOOK_URL ||
        'http://localhost:3000/webhooks/provider';

      try {
        await this.httpService.axiosRef.post(webhookUrl, {
          event: 'transfer.status_updated',
          provider_ref: providerRef,
          status: 'payment_submitted',
          reference_id: referenceId,
          timestamp: new Date().toISOString(),
        });

        setTimeout(async () => {
          await this.httpService.axiosRef.post(webhookUrl, {
            event: 'transfer.status_updated',
            provider_ref: providerRef,
            status: succeeded ? 'payment_processed' : 'returned',
            reference_id: referenceId,
            timestamp: new Date().toISOString(),
          });
        }, delayMs);
      } catch (err) {
        this.logger.error(`[STUB] Webhook failed: ${err.message}`);
      }
    }, delayMs);

    return {
      providerRef,
      status: ProviderStatus.PENDING,
      rawStatus: 'awaiting_funds',
      rawPayload: { stub: true, amount, currency, destinationId, referenceId },
    };
  }

  async getTransferStatus(
    providerRef: string,
  ): Promise<ProviderTransferResult> {
    this.logger.log(`[STUB] Status check for ${providerRef}`);

    // In a real provider, this would call their API.
    // The stub returns PROCESSING since webhooks handle the real updates.
    return {
      providerRef,
      status: ProviderStatus.PROCESSING,
      rawStatus: 'payment_submitted',
      rawPayload: { stub: true, providerRef },
    };
  }
}
