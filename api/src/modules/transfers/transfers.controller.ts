import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
}
