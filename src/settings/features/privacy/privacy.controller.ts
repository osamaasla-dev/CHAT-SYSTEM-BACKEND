import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import type { PrivacySettings } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtSessionGuard } from 'src/auth/guards/jwt-session.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserType } from 'src/auth/types/auth.types';
import { UpdatePrivacySettingsDto } from './dto/update-privacy-settings.dto';
import { UpdatePrivacySettingsService } from './services/update-privacy-settings.service';
import { GetPrivacySettingService } from './services/get-privacy-setting.service';

@Controller('settings')
export class PrivacyController {
  constructor(
    private readonly updatePrivacySettingsService: UpdatePrivacySettingsService,
    private readonly getPrivacySettingService: GetPrivacySettingService,
  ) {}

  @Get('privacy')
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async getPrivacySettings(
    @CurrentUser() user: CurrentUserType,
  ): Promise<PrivacySettings> {
    return this.getPrivacySettingService.execute(user.id);
  }

  @Patch('privacy')
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async updatePrivacySettings(
    @CurrentUser() user: CurrentUserType,
    @Body() body: UpdatePrivacySettingsDto,
  ): Promise<void> {
    await this.updatePrivacySettingsService.execute(user.id, body);
  }
}
