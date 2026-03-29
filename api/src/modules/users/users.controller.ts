import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserAccount } from 'src/generated/prisma/client';
import { AccountBalance } from 'src/types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto): Promise<{
    user: User;
    userAccount: UserAccount;
  }> {
    return this.usersService.createUser(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findUser(id);
  }

  @Get(':id/accounts')
  getAccounts(@Param('id') id: string): Promise<UserAccount[]> {
    return this.usersService.getAccounts(id);
  }

  @Get('account/:id')
  getBalance(@Param('id') accountId: string): Promise<AccountBalance> {
    return this.usersService.getBalance(accountId);
  }
}
