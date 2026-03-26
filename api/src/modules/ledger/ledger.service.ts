import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, type Client } from 'tigerbeetle-node';

@Injectable()
export class LedgerService implements OnModuleInit, OnModuleDestroy {
  private tbClient: Client;

  async onModuleInit() {
    this.tbClient = createClient({
      cluster_id: 0n,
      replica_addresses: [process.env.TB_ADDRESS || '3002'],
    });
  }

  async onModuleDestroy() {
    this.tbClient.destroy();
  }
}
