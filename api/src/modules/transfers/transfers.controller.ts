import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';

@ApiTags('Transfers')
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a transfer between two users' })
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
    return this.transfersService.createTransfer(dto);
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
