import { Injectable } from '@nestjs/common';
import { PasswordManagementService } from './services/password-management.service';

@Injectable()
export class PasswordService {
  constructor(
    private readonly passwordManagementService: PasswordManagementService,
  ) {}

  async changePassword(
    userId: string,
    sessionId: string | null,
    currentPassword: string,
    newPassword: string,
  ) {
    return this.passwordManagementService.changePassword(
      userId,
      sessionId,
      currentPassword,
      newPassword,
    );
  }

  async requestPasswordReset(email: string) {
    return this.passwordManagementService.requestPasswordReset(email);
  }

  async resetPassword(token: string, password: string) {
    return this.passwordManagementService.resetPassword(token, password);
  }
}
