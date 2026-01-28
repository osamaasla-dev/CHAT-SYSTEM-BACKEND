import { Body, Controller, Post } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { ModerateTextDto } from './dto/moderate-text.dto';

@Controller()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('text')
  async moderateText(@Body() body: ModerateTextDto) {
    return this.moderationService.moderateText(body.text);
  }
}
