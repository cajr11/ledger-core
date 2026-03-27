import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { error } from 'console';
import { AccountType, Ledger } from 'src/types';
import { createClient, id, type Client } from 'tigerbeetle-node';

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

  async createAccount({ ledger, code }: { ledger: Ledger; code: AccountType }) {
    const account = {
      id: id(), // TigerBeetle time-based ID.
      debits_pending: 0n,
      debits_posted: 0n,
      credits_pending: 0n,
      credits_posted: 0n,
      user_data_128: 0n,
      user_data_64: 0n,
      user_data_32: 0,
      reserved: 0,
      ledger: ledger,
      code: code,
      flags: 0,
      timestamp: 0n,
    };

    try {
      const results = await this.tbClient.createAccounts([account]);
      console.log(results);
      return results;
    } catch (error) {
      console.error(error);
    }
  }

  async createTransfer({
    debitAccountId,
    creditAccountId,
    amount,
    ledger,
    code,
  }: {
    debitAccountId: bigint;
    creditAccountId: bigint;
    amount: bigint;
    ledger: Ledger;
    code: AccountType;
  }) {
    const transfer = [
      {
        id: id(),
        debit_account_id: debitAccountId,
        credit_account_id: creditAccountId,
        amount: amount, // 10 cents, using the smallest unit and avoiding floating point numbers
        pending_id: 0n,
        user_data_128: 0n,
        user_data_64: 0n,
        user_data_32: 0,
        timeout: 0,
        ledger: ledger,
        code: code,
        flags: 0,
        timestamp: 0n,
      },
    ];

    try {
      const createdTransfers = await this.tbClient.createTransfers(transfer);
      console.log(createdTransfers);
      return createdTransfers;
    } catch (error) {
      console.error(error);
    }
  }

  async getAccountBalance(accountId: bigint) {
    try {
      const accounts = await this.tbClient.lookupAccounts([accountId]);

      if (!accounts.length) {
        throw new Error(`No accounts found with id ${accountId}`);
      }
      const account = accounts[0];

      return {
        creditsPosted: account.credits_posted,
        debitsPosted: account.debits_posted,
        creditsPending: account.credits_pending,
        debitsPending: account.debits_pending,
        balance: account.credits_posted - account.debits_posted, // for liability accounts
      };
    } catch (error) {
      console.error(error);
    }
  }
}
