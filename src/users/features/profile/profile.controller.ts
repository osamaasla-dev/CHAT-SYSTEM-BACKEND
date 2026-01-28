import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtSessionGuard } from 'src/auth/guards/jwt-session.guard';
import { GetMyProfileService } from './services/get-my-profile.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserType } from 'src/auth/types/auth.types';
import { ChangeProfileNameService } from './services/change-profile-name.service';
import { ChangeNameDto } from './dto/change-name.dto';
import { Throttle } from '@nestjs/throttler';
import { ChangeProfileAvatarService } from './services/change-profile-avatar.service';
import type { FastifyRequest } from 'fastify';
import type { ChangeAvatarResult } from './types/my-profile.types';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly getMyProfileService: GetMyProfileService,
    private readonly changeProfileNameService: ChangeProfileNameService,
    private readonly changeProfileAvatarService: ChangeProfileAvatarService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async getMe(@CurrentUser() user: CurrentUserType) {
    return this.getMyProfileService.getByUserId(user.id);
  }

  @Patch('name')
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  @Throttle({ default: { limit: 1, ttl: 60 * 60 * 24 } })
  async changeName(
    @CurrentUser() user: CurrentUserType,
    @Body() body: ChangeNameDto,
  ): Promise<void> {
    await this.changeProfileNameService.execute(user.id, body.name);
  }

  @Patch('avatar/change')
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async changeAvatar(
    @CurrentUser() user: CurrentUserType,
    @Req() request: FastifyRequest,
  ): Promise<ChangeAvatarResult> {
    const file = await request.file();

    return this.changeProfileAvatarService.execute({
      userId: user.id,
      stream: file?.file,
    });
  }
}
