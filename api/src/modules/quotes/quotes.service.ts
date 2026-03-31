import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentProvider,
  PAYMENT_PROVIDER,
} from '../providers/payment-provider-adapter.interface';
import { FEE_RATE } from 'src/types';
import { Decimal } from '@prisma/client/runtime/client';
import { randomUUID } from 'crypto';

interface Quote {
  id: string;
  senderCurrency: string;
  recipientCurrency: string;
  amount: string;
  fee: string;
  amountAfterFee: string;
  exchangeRate: string;
  convertedAmount: string;
  expiresAt: Date;
}

const QUOTE_TTL_SECONDS = 30;

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);
  private readonly quotes = new Map<string, Quote>();

  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProvider,
  ) {}

  async createQuote(dto: {
    senderCurrency: string;
    recipientCurrency: string;
    amount: string;
  }): Promise<Quote> {
    const { rate } = await this.paymentProvider.getExchangeRate(
      dto.senderCurrency,
      dto.recipientCurrency,
    );

    const amount = new Decimal(dto.amount);
    const fee = amount.mul(FEE_RATE).toFixed(0);
    const amountAfterFee = amount.sub(fee).toFixed(0);
    const convertedAmount = new Decimal(amountAfterFee).mul(rate).toFixed(0);

    const quote: Quote = {
      id: randomUUID(),
      senderCurrency: dto.senderCurrency,
      recipientCurrency: dto.recipientCurrency,
      amount: dto.amount,
      fee,
      amountAfterFee,
      exchangeRate: rate,
      convertedAmount,
      expiresAt: new Date(Date.now() + QUOTE_TTL_SECONDS * 1000),
    };

    this.quotes.set(quote.id, quote);

    // Auto-expire
    setTimeout(() => {
      this.quotes.delete(quote.id);
      this.logger.log(`Quote ${quote.id} expired`);
    }, QUOTE_TTL_SECONDS * 1000);

    return quote;
  }

  getQuote(id: string): Quote {
    const quote = this.quotes.get(id);

    if (!quote) {
      throw new NotFoundException(`Quote ${id} not found or expired`);
    }

    if (new Date() > quote.expiresAt) {
      this.quotes.delete(id);
      throw new BadRequestException(`Quote ${id} has expired`);
    }

    return quote;
  }

  consumeQuote(id: string): Quote {
    const quote = this.getQuote(id);
    this.quotes.delete(id);
    return quote;
  }
}
