import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SystemAccountsService } from './system-accounts.service';
import { CreateFundingAccountDto } from './dto/create-funding-account.dto';

@ApiTags('System Accounts')
@Controller('system-accounts')
export class SystemAccountsController {
  constructor(
    private readonly systemAccountsService: SystemAccountsService,
  ) {}

  @Post('funding')
  @ApiOperation({ summary: 'Create a system-level funding source account for a currency' })
  @ApiResponse({ status: 201, description: 'Funding account created' })
  @ApiResponse({ status: 409, description: 'A funding account for this currency already exists' })
  createFunding(@Body() dto: CreateFundingAccountDto) {
    return this.systemAccountsService.createFundingAccount(dto.currency);
  }

  @Get()
  @ApiOperation({ summary: 'Get all system accounts' })
  @ApiResponse({ status: 200, description: 'List of system accounts' })
  getAll() {
    return this.systemAccountsService.getFundingAccounts();
  }

  @Get(':currency')
  @ApiOperation({ summary: 'Get a funding account by currency' })
  @ApiParam({ name: 'currency', description: 'ISO 4217 currency code', example: 'MXN' })
  @ApiResponse({ status: 200, description: 'Funding account found' })
  getByCurrency(@Param('currency') currency: string) {
    return this.systemAccountsService.getFundingAccountByCurrency(currency);
  }
}
