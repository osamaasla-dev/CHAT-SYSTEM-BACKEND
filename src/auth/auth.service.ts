import { Injectable } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import type { RequestWithCookies } from './types/auth.types';
import { SignupService } from './services/use-cases/signup.service';
import { LoginService } from './services/use-cases/login.service';
import { RefreshTokensService } from './services/use-cases/refresh-tokens.service';
import { LogoutService } from './services/use-cases/logout.service';
import { LogoutAllDevicesService } from './services/use-cases/logout-all-devices.service';
import { AuthSessionsService } from './services/use-cases/sessions.service';
import { PasswordManagementService } from './services/use-cases/password-management.service';
import { VerifyEmailService } from './services/use-cases/verify-email.service';
import { ChangeEmailService } from './services/use-cases/change-email.service';
import { TokenIntrospectionService } from './services/use-cases/token-introspection.service';
import { CreateMfaChallengeService } from './services/use-cases/create-mfa-challenge.service';
import { VerifyMfaChallengeService } from './services/use-cases/verify-mfa-challenge.service';
import type { TokenIntrospectionResponse } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly signupService: SignupService,
    private readonly loginService: LoginService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly logoutService: LogoutService,
    private readonly logoutAllDevicesService: LogoutAllDevicesService,
    private readonly authSessionsService: AuthSessionsService,
    private readonly passwordManagementService: PasswordManagementService,
    private readonly verifyEmailService: VerifyEmailService,
    private readonly changeEmailService: ChangeEmailService,
    private readonly tokenIntrospectionService: TokenIntrospectionService,
    private readonly createMfaChallengeService: CreateMfaChallengeService,
    private readonly verifyMfaChallengeService: VerifyMfaChallengeService,
  ) {}

  signup(name: string, email: string, password: string) {
    return this.signupService.execute({ name, email, password });
  }

  login(email: string, password: string, response: FastifyReply) {
    return this.loginService.execute({ email, password, response });
  }

  refreshTokens(request: RequestWithCookies, response: FastifyReply) {
    return this.refreshTokensService.execute({ request, response });
  }

  logout(request: RequestWithCookies) {
    return this.logoutService.execute({ request });
  }

  logoutFromAllDevices(request: RequestWithCookies) {
    return this.logoutAllDevicesService.execute({ request });
  }

  getSessions(userId: string) {
    return this.authSessionsService.getSessions(userId);
  }

  revokeSessionById(request: RequestWithCookies, sessionId: string) {
    return this.authSessionsService.revokeSessionById(request, sessionId);
  }

  changePassword(
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

  verifyEmail(token: string, request?: RequestWithCookies) {
    return this.verifyEmailService.execute(token, request);
  }

  requestPasswordReset(email: string) {
    return this.passwordManagementService.requestPasswordReset(email);
  }

  resetPassword(token: string, newPassword: string) {
    return this.passwordManagementService.resetPassword(token, newPassword);
  }

  changeEmail(userId: string, newEmail: string) {
    return this.changeEmailService.execute({ userId, newEmail });
  }

  introspectToken(
    request: RequestWithCookies,
  ): Promise<TokenIntrospectionResponse> {
    return this.tokenIntrospectionService.introspect(request);
  }

  createMfaChallenge(request: RequestWithCookies, response: FastifyReply) {
    return this.createMfaChallengeService.execute(request, response);
  }

  verifyMfaChallenge(
    code: string,
    request: RequestWithCookies,
    response: FastifyReply,
  ) {
    return this.verifyMfaChallengeService.execute(code, request, response);
  }
}
