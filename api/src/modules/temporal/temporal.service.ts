import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Client, Connection, WorkflowHandle } from '@temporalio/client';
import { Worker, NativeConnection } from '@temporalio/worker';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import {
  PaymentProvider,
  PAYMENT_PROVIDER,
} from '../providers/payment-provider-adapter.interface';
import { createActivities, CrossBorderInput } from './activities';
import {
  crossBorderTransferWorkflow,
  providerStatusSignal,
} from './workflows';

const TASK_QUEUE = 'cross-border-transfers';

@Injectable()
export class TemporalService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private worker: Worker;
  private readonly logger = new Logger(TemporalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    @Inject(PAYMENT_PROVIDER)
    private readonly provider: PaymentProvider,
  ) {}

  async onModuleInit() {
    const address = process.env.TEMPORAL_ADDRESS || 'temporal:7233';

    // Client connection (for starting workflows and signaling)
    const connection = await Connection.connect({ address });
    this.client = new Client({ connection });

    // Worker connection and setup
    const nativeConnection = await NativeConnection.connect({ address });
    const activities = createActivities(this.prisma, this.ledger, this.provider);

    this.worker = await Worker.create({
      connection: nativeConnection,
      namespace: 'default',
      taskQueue: TASK_QUEUE,
      workflowsPath: require.resolve('./workflows'),
      activities,
    });

    // Start worker in background
    this.worker.run().catch((err) => {
      this.logger.error('Temporal worker failed:', err);
    });

    this.logger.log(`Temporal worker started on queue: ${TASK_QUEUE}`);
  }

  async onModuleDestroy() {
    this.worker?.shutdown();
  }

  async startCrossBorderTransfer(input: CrossBorderInput): Promise<string> {
    const handle = await this.client.workflow.start(
      crossBorderTransferWorkflow,
      {
        taskQueue: TASK_QUEUE,
        workflowId: `cross-border-${input.transferId}`,
        args: [input],
      },
    );

    this.logger.log(
      `Started workflow ${handle.workflowId} for transfer ${input.transferId}`,
    );

    return handle.workflowId;
  }

  async signalProviderStatus(
    transferId: string,
    status: string,
  ): Promise<void> {
    const workflowId = `cross-border-${transferId}`;

    try {
      const handle = this.client.workflow.getHandle(workflowId);
      await handle.signal(providerStatusSignal, status);
      this.logger.log(
        `Signaled workflow ${workflowId} with status: ${status}`,
      );
    } catch (error) {
      this.logger.warn(
        `Could not signal workflow ${workflowId}: ${error.message}`,
      );
    }
  }
}
