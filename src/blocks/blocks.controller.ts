import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtSessionGuard } from 'src/auth/guards/jwt-session.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserType } from 'src/auth/types/auth.types';
import { GetBlockedUsersService } from './services/get-blocked-users.service';
import { GetBlockedUsersDto } from './dto/get-blocked-users.dto';
import { GetBlockedUsersCountService } from './services/get-blocked-users-count.service';
import { DeleteBlockService } from './services/delete-block.service';
import { CreateBlockService } from './services/create-block.service';

@Controller('blocks')
export class BlocksController {
  constructor(
    private readonly getBlockedUsersService: GetBlockedUsersService,
    private readonly getBlockedUsersCountService: GetBlockedUsersCountService,
    private readonly deleteBlockService: DeleteBlockService,
    private readonly createBlockService: CreateBlockService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async getMyBlockedUsers(
    @CurrentUser() user: CurrentUserType,
    @Query() query: GetBlockedUsersDto,
  ) {
    return await this.getBlockedUsersService.execute({
      userId: user.id,
      cursor: query.cursor,
      limit: query.limit,
    });
  }

  @Get('count')
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async getMyBlockedUsersCount(@CurrentUser() user: CurrentUserType) {
    return await this.getBlockedUsersCountService.execute(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async createBlock(
    @CurrentUser() user: CurrentUserType,
    @Body('blockedUserId') blockedUserId: string,
  ) {
    return await this.createBlockService.execute(user.id, blockedUserId);
  }

  @Delete(':blockedUserId')
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async deleteBlock(
    @CurrentUser() user: CurrentUserType,
    @Param('blockedUserId') blockedUserId: string,
  ) {
    return await this.deleteBlockService.execute(user.id, blockedUserId);
  }
}
