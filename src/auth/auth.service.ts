import { Injectable } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import type { RequestWithCookies } from 'src/common/types/request.types';
import { AccountService } from './modules/account/account.service';
import { AuthSessionService } from './modules/session/auth-session.service';
import { PasswordService } from './modules/password/password.service';
import { EmailService } from './modules/email/email.service';
import { MfaService } from './modules/mfa/mfa.service';
import type { TokenIntrospectionResponse } from './modules/session/types/session.types';
import { TokenService } from './modules/token/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly accountService: AccountService,
    private readonly authSessionService: AuthSessionService,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
    private readonly mfaService: MfaService,
    private readonly tokenManagement: TokenService,
  ) {}

  signup(name: string, email: string, password: string) {
    return this.accountService.signup(name, email, password);
  }

  login(email: string, password: string, response: FastifyReply) {
    return this.accountService.login(email, password, response);
  }

  refreshTokens(request: RequestWithCookies, response: FastifyReply) {
    return this.authSessionService.refreshTokens(request, response);
  }

  logout(request: RequestWithCookies) {
    return this.authSessionService.logout(request);
  }

  logoutFromAllDevices(request: RequestWithCookies) {
    return this.authSessionService.logoutAllDevices(request);
  }

  getSessions(userId: string) {
    return this.authSessionService.getSessions(userId);
  }

  revokeSessionById(request: RequestWithCookies, sessionId: string) {
    return this.authSessionService.revokeSessionById(request, sessionId);
  }

  changePassword(
    userId: string,
    sessionId: string | null,
    currentPassword: string,
    newPassword: string,
  ) {
    return this.passwordService.changePassword(
      userId,
      sessionId,
      currentPassword,
      newPassword,
    );
  }

  verifyEmail(
    token: string,
    response: FastifyReply,
    request?: RequestWithCookies,
  ) {
    return this.emailService.verifyEmail(token, response, request);
  }

  requestPasswordReset(email: string) {
    return this.passwordService.requestPasswordReset(email);
  }

  resetPassword(token: string, newPassword: string) {
    return this.passwordService.resetPassword(token, newPassword);
  }

  changeEmail(userId: string, newEmail: string) {
    return this.emailService.changeEmail(userId, newEmail);
  }

  introspectToken(
    request: RequestWithCookies,
  ): Promise<TokenIntrospectionResponse> {
    return this.authSessionService.introspectToken(request);
  }

  createMfaChallenge(request: RequestWithCookies, response: FastifyReply) {
    return this.mfaService.createMfaChallenge(request, response);
  }

  verifyMfaChallenge(
    code: string,
    request: RequestWithCookies,
    response: FastifyReply,
  ) {
    return this.mfaService.verifyMfaChallenge(code, request, response);
  }

  get tokenService() {
    return this.tokenManagement;
  }
}
