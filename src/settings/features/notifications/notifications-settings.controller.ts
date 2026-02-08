import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtSessionGuard } from 'src/auth/guards/jwt-session.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserType } from 'src/auth/types/auth.types';
import { GetNotificationsSettingsService } from './services/get-notifications-settings.service';
import { UpdateNotificationsSettingsService } from './services/update-notifications-settings.service';
import { UpdateNotificationsSettingsDto } from './dto/notifications-settings.dto';

@Controller('settings')
export class NotificationsSettingsController {
  constructor(
    private readonly getNotificationsSettingsService: GetNotificationsSettingsService,
    private readonly updateNotificationsSettingsService: UpdateNotificationsSettingsService,
  ) {}

  @Get('notifications')
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async getSettings(@CurrentUser() user: CurrentUserType) {
    return this.getNotificationsSettingsService.execute(user.id);
  }

  @Patch('notifications')
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async updateSettings(
    @CurrentUser() user: CurrentUserType,
    @Body() body: UpdateNotificationsSettingsDto,
  ): Promise<void> {
    await this.updateNotificationsSettingsService.execute(user.id, body);
  }
}
