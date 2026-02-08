import { Controller, Delete, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtSessionGuard } from 'src/auth/guards/jwt-session.guard';
import { DeleteAccountService } from './services/delete-account.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserType } from 'src/auth/types/auth.types';
import { CancelDeleteAccountService } from './services/cancel-delete-account.service';
import { DeactivateAccountService } from './services/deactivate-account.service';
import { ReactivateAccountService } from './services/reactivate-account.service';

@Controller('account')
export class AccountController {
  constructor(
    private readonly deleteAccountService: DeleteAccountService,
    private readonly cancelDeleteAccountService: CancelDeleteAccountService,
    private readonly deactivateAccountService: DeactivateAccountService,
    private readonly reactivateAccountService: ReactivateAccountService,
  ) {}

  @Delete('delete')
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async deleteAccount(@CurrentUser() user: CurrentUserType): Promise<void> {
    await this.deleteAccountService.execute(user.id);
  }

  @Patch('delete/cancel')
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async cancelDelete(@CurrentUser() user: CurrentUserType): Promise<void> {
    await this.cancelDeleteAccountService.execute(user.id);
  }

  @Patch('deactive')
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async deactivate(@CurrentUser() user: CurrentUserType): Promise<void> {
    await this.deactivateAccountService.execute(user.id);
  }

  @Patch('reactive')
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async reactivate(@CurrentUser() user: CurrentUserType): Promise<void> {
    await this.reactivateAccountService.execute(user.id);
  }
}
