import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import type { User } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import type { FindAllResponse } from './types/user.type';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @Query('limit') limit: string,
    @Query('cursor') cursor?: string,
  ): Promise<FindAllResponse> {
    return this.usersService.findAll({
      limit: Number(limit) || 10,
      cursor: cursor ? cursor : undefined,
    });
  }

  @Patch(':id')
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string): Promise<void> {
    return this.usersService.delete(id);
  }
}
