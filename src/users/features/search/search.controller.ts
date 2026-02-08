import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchUserByUsernameService } from './services/search-user-by-username.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtSessionGuard } from 'src/auth/guards/jwt-session.guard';
import type { CurrentUserType } from 'src/auth/types/auth.types';
import { SearchUserDto } from './dto/search-user.dto';

@Controller('users')
export class SearchController {
  constructor(
    private readonly searchUserByUsernameService: SearchUserByUsernameService,
  ) {}

  @Get('search')
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async searchUserByUsername(
    @CurrentUser() user: CurrentUserType,
    @Query() search: SearchUserDto,
  ) {
    return this.searchUserByUsernameService.execute(user.id, search.username);
  }
}
