import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { LedgerService } from './modules/ledger/ledger.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly ledgerService: LedgerService,
  ) {}

  @Get()
  async testFlow() {}
}
