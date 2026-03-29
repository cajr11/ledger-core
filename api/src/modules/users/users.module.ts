import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [LedgerModule, PrismaModule],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
