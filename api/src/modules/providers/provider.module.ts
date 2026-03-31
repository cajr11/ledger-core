import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { StubProviderService } from './stub-provider.service';
import { PAYMENT_PROVIDER } from './payment-provider-adapter.interface';

@Module({})
export class ProviderModule {
  static register(): DynamicModule {
    return {
      module: ProviderModule,
      imports: [HttpModule],
      providers: [
        StubProviderService,
        { provide: PAYMENT_PROVIDER, useClass: StubProviderService },
      ],
      exports: [PAYMENT_PROVIDER, StubProviderService],
    };
  }
}
