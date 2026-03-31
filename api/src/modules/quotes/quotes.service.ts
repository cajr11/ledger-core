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
import { RedisService } from '../redis/redis.service';
import { FEE_RATE } from 'src/types';
import { Decimal } from '@prisma/client/runtime/client';
import { randomUUID } from 'crypto';

export type Quote = {
  id: string;
  senderCurrency: string;
  recipientCurrency: string;
  amount: string;
  fee: string;
  amountAfterFee: string;
  exchangeRate: string;
  convertedAmount: string;
  expiresAt: string;
};

const QUOTE_TTL_SECONDS = 30;
const QUOTE_KEY_PREFIX = 'quote:';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProvider,
    private readonly redisService: RedisService,
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
      expiresAt: new Date(Date.now() + QUOTE_TTL_SECONDS * 1000).toISOString(),
    };

    await this.redisService.set(
      `${QUOTE_KEY_PREFIX}${quote.id}`,
      JSON.stringify(quote),
      QUOTE_TTL_SECONDS,
    );

    return quote;
  }

  async getQuote(id: string): Promise<Quote> {
    const data = await this.redisService.get(`${QUOTE_KEY_PREFIX}${id}`);

    if (!data) {
      throw new NotFoundException(`Quote ${id} not found or expired`);
    }

    return JSON.parse(data);
  }

  async consumeQuote(id: string): Promise<Quote> {
    const quote = await this.getQuote(id);
    await this.redisService.del(`${QUOTE_KEY_PREFIX}${id}`);
    return quote;
  }
}
