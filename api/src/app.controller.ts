import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { LedgerService } from './modules/ledger/ledger.service';
import { AccountType, Ledger, TransferType } from './types';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly ledgerService: LedgerService,
  ) {}

  @Get()
  async testFlow() {
    try {
      const fundingAccId = await this.ledgerService.createAccount({
        ledger: Ledger.MXN,
        code: AccountType.FUNDING_SOURCE,
      });

      if (!fundingAccId) throw new Error('Funding account creation failed');

      const firstAccId = await this.ledgerService.createAccount({
        ledger: Ledger.MXN,
        code: AccountType.USER_WALLET,
      });

      if (!firstAccId) throw new Error('First account creation failed');

      const secondAccId = await this.ledgerService.createAccount({
        ledger: Ledger.MXN,
        code: AccountType.USER_WALLET,
      });

      if (!secondAccId) throw new Error('Second account creation failed');

      // Fund first account
      await this.ledgerService.createTransfer({
        debitAccountId: fundingAccId,
        creditAccountId: firstAccId,
        amount: 1000n,
        ledger: Ledger.MXN,
        code: TransferType.FUNDING,
      });

      // transfer same currency to second account
      await this.ledgerService.createTransfer({
        debitAccountId: firstAccId,
        creditAccountId: secondAccId,
        amount: 500n,
        ledger: Ledger.MXN,
        code: TransferType.TRANSFER,
      });

      const fundingAccBalance =
        await this.ledgerService.getAccountBalance(fundingAccId);

      const firstAccBalance =
        await this.ledgerService.getAccountBalance(firstAccId);

      const secAccBalance =
        await this.ledgerService.getAccountBalance(secondAccId);

      console.log('📶 funding acc balance:', fundingAccBalance);
      console.log('1️⃣ first acc balance:', firstAccBalance);
      console.log('2️⃣ sec acc balance:', secAccBalance);
    } catch (error) {
      console.error(error);
    }
  }
}
