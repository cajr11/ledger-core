import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { lookup } from 'dns/promises';
import { AccountType, Ledger, TransferType } from 'src/types';
import { AccountFlags, createClient, id, type Client } from 'tigerbeetle-node';

@Injectable()
export class LedgerService implements OnModuleInit, OnModuleDestroy {
  private tbClient: Client;
  private readonly logger = new Logger(LedgerService.name, { timestamp: true });

  async onModuleInit() {
    const host = process.env.TB_HOST || 'localhost';
    const port = process.env.TB_PORT || '3002';

    // Resolve hostname to IP (TigerBeetle client only accepts IPs)
    try {
      const { address } = await lookup(host);

      this.tbClient = createClient({
        cluster_id: 0n,
        replica_addresses: [`${address}:${port}`],
      });
    } catch (error) {
      throw new Error(
        `Cannot resolve TigerBeetle host "${host}" — is the container running?`,
      );
    }
  }

  async onModuleDestroy() {
    this.tbClient.destroy();
  }

  async createAccounts(dto: { ledger: Ledger; code: AccountType }[]) {
    const accounts = dto.map((acc) => ({
      id: id(),
      debits_pending: 0n,
      debits_posted: 0n,
      credits_pending: 0n,
      credits_posted: 0n,
      user_data_128: 0n,
      user_data_64: 0n,
      user_data_32: 0,
      reserved: 0,
      ledger: acc.ledger,
      code: acc.code,
      flags:
        acc.code === AccountType.USER_WALLET
          ? AccountFlags.debits_must_not_exceed_credits
          : 0,
      timestamp: 0n,
    }));

    try {
      const results = await this.tbClient.createAccounts(accounts);

      if (results.length > 0)
        throw new Error(
          `Account creation failed with status code ${results[0].result}`,
        );

      return accounts.map((acc) => acc.id);
    } catch (error) {
      this.logger.error('FAILED ACCOUNT CREATION:', error);
      throw error;
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
    code: TransferType;
  }) {
    const transferId = id();

    const transfer = [
      {
        id: transferId,
        debit_account_id: debitAccountId,
        credit_account_id: creditAccountId,
        amount: amount, // e.g 10 cents, using the smallest unit and avoiding floating point numbers
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
      const results = await this.tbClient.createTransfers(transfer);

      if (results.length > 0)
        throw new Error(
          `Transfer failed with status code ${results[0].result}`,
        );

      return transferId;
    } catch (error) {
      this.logger.error('FAILED TRANSFER TB:', error);
      throw error;
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
        creditsPosted: account.credits_posted.toString(),
        debitsPosted: account.debits_posted.toString(),
        creditsPending: account.credits_pending.toString(),
        debitsPending: account.debits_pending.toString(),
        balance: (account.credits_posted - account.debits_posted).toString(),
      };
    } catch (error) {
      this.logger.error('FAILED GETTING BALANCE:', error);
      throw error;
    }
  }
}
