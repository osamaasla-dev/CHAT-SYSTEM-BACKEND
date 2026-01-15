import { Controller, Get, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { CurrentUserType } from 'src/auth/types/auth.types';
import { JwtSessionGuard } from 'src/auth/guards/jwt-session.guard';

@Controller('profile')
@UseGuards(JwtAuthGuard, JwtSessionGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@CurrentUser() user: CurrentUserType) {
    return this.profileService.getProfile(user.id);
  }
}
