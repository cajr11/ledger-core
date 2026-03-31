import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({
    summary: 'Get a transfer quote with exchange rate, fee, and converted amount',
    description:
      'Returns a quote locked for 30 seconds. Use the quote ID when creating a cross-border transfer.',
  })
  @ApiResponse({ status: 201, description: 'Quote created with locked rate' })
  create(@Body() dto: CreateQuoteDto) {
    return this.quotesService.createQuote(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a quote by ID' })
  @ApiParam({ name: 'id', description: 'Quote UUID' })
  @ApiResponse({ status: 200, description: 'Quote found and still valid' })
  @ApiResponse({ status: 404, description: 'Quote not found or expired' })
  findOne(@Param('id') id: string) {
    return this.quotesService.getQuote(id);
  }
}
