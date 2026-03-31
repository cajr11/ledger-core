import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import { CrossBorderTransferService } from './cross-border-transfer.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { FundAccountDto } from './dto/fund-account.dto';

@ApiTags('Transfers')
@Controller('transfers')
export class TransfersController {
  constructor(
    private readonly transfersService: TransfersService,
    private readonly crossBorderService: CrossBorderTransferService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a transfer. Routes to same-currency or cross-border based on currencies.' })
  @ApiResponse({ status: 201, description: 'Transfer created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid account or insufficient balance',
  })
  @ApiResponse({
    status: 409,
    description:
      'Duplicate idempotency key. Original transfer returned instead of creating a new one.',
  })
  create(@Body() dto: CreateTransferDto) {
    if (dto.senderCurrency === dto.recipientCurrency) {
      return this.transfersService.createTransfer(dto);
    }
    return this.crossBorderService.createTransfer({
      idempotencyKey: dto.idempotencyKey,
      senderId: dto.senderId,
      senderCurrency: dto.senderCurrency,
      recipientCurrency: dto.recipientCurrency,
      amount: dto.amount,
      recipientDetails: dto.recipientDetails || {},
      quoteId: dto.quoteId,
    });
  }

  @Post('fund')
  @ApiOperation({ summary: 'Fund a user wallet from the system funding account' })
  @ApiResponse({ status: 201, description: 'Account funded successfully' })
  @ApiResponse({ status: 400, description: 'No funding account for this currency or user wallet not found' })
  fund(@Body() dto: FundAccountDto) {
    return this.transfersService.fundAccount(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transfer by ID' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({ status: 200, description: 'Transfer found' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  findOne(@Param('id') id: string) {
    return this.transfersService.getTransfer(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get the full status history of a transfer' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({ status: 200, description: 'List of status transitions ordered by time' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  getHistory(@Param('id') id: string) {
    return this.transfersService.getTransferHistory(id);
  }
}
