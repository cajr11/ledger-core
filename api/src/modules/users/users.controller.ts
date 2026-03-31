import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserAccount } from 'src/generated/prisma/client';
import { AccountBalance } from 'src/types';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user with a wallet account' })
  @ApiResponse({ status: 201, description: 'User and wallet account created' })
  @ApiResponse({ status: 409, description: 'A user with this email already exists' })
  create(@Body() dto: CreateUserDto): Promise<{
    user: User;
    userAccount: UserAccount;
  }> {
    return this.usersService.createUser(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findUser(id);
  }

  @Get(':id/accounts')
  @ApiOperation({ summary: 'Get all accounts for a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'List of user accounts' })
  @ApiResponse({ status: 404, description: 'No accounts found for this user' })
  getAccounts(@Param('id') id: string): Promise<UserAccount[]> {
    return this.usersService.getAccounts(id);
  }

  @Get('account/:id')
  @ApiOperation({ summary: 'Get account balance from TigerBeetle' })
  @ApiParam({ name: 'id', description: 'UserAccount UUID (not the TigerBeetle ID)' })
  @ApiResponse({ status: 200, description: 'Account balance returned' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  getBalance(@Param('id') accountId: string): Promise<AccountBalance> {
    return this.usersService.getBalance(accountId);
  }
}
