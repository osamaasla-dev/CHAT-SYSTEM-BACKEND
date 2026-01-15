import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import * as bcrypt from 'bcrypt';
import { LoggingService } from '../logging/logging.service';
import { LogLevel } from '@prisma/client';
import { TokenManagerService } from './services/token-manager.service';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { RequestContextService } from '../common/services/request-context.service';
import type { RequestWithCookies } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenManager: TokenManagerService,
    private readonly sessionService: SessionsService,
    private readonly usersService: UsersService,
    private readonly requestContextService: RequestContextService,
    private readonly loggingService: LoggingService,
  ) {}

  async signup(name: string, email: string, password: string) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      await this.loggingService.logEvent({
        type: 'SIGNUP_EMAIL_IN_USE',
        level: LogLevel.WARN,
        userId: existingUser.id,
        context: { email },
      });
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.usersService.createUser({
      name,
      email,
      password: hashedPassword,
    });

    await this.loggingService.logEvent({
      type: 'SIGNUP_SUCCESS',
      level: LogLevel.INFO,
      userId: user.id,
      context: { email },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async login(email: string, password: string, response: FastifyReply) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      await this.loggingService.logEvent({
        type: 'LOGIN_USER_NOT_FOUND',
        level: LogLevel.WARN,
        context: { email },
      });
      throw new NotFoundException('User not found');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      await this.loggingService.logEvent({
        type: 'LOGIN_INVALID_PASSWORD',
        level: LogLevel.WARN,
        userId: user.id,
        context: { email },
      });
      throw new UnauthorizedException('Invalid credentials');
    }
    const sessionContext = this.requestContextService.snapshot();
    const newSession = await this.sessionService.createSession(
      user.id,
      sessionContext,
    );
    const newRefreshVersion = newSession.refreshVersion + 1;
    const tokens = this.tokenManager.generateTokens(user, {
      id: newSession.id,
      refreshVersion: newRefreshVersion,
    });
    await this.sessionService.persistRefreshToken(
      newSession.id,
      tokens.refresh_token,
      newSession.refreshVersion,
      sessionContext,
    );

    this.tokenManager.setTokenCookies(tokens, response);

    await this.loggingService.logEvent({
      type: 'LOGIN_SUCCESS',
      level: LogLevel.INFO,
      userId: user.id,
      context: { sessionId: newSession.id },
    });

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async refreshTokens(request: RequestWithCookies, response: FastifyReply) {
    try {
      const refreshToken = request.cookies?.refresh_token;

      if (!refreshToken) {
        throw new UnauthorizedException('No refresh token provided');
      }

      const sessionContext = this.requestContextService.snapshot();
      const { session, payload } =
        await this.sessionService.validateRefreshToken(
          refreshToken,
          sessionContext,
        );

      // Get user data
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newRefreshVersion = session.refreshVersion + 1;
      const tokens = this.tokenManager.generateTokens(user, {
        id: session.id,
        refreshVersion: newRefreshVersion,
      });
      await this.sessionService.persistRefreshToken(
        session.id,
        tokens.refresh_token,
        session.refreshVersion,
        sessionContext,
      );

      this.tokenManager.setTokenCookies(tokens, response);

      await this.loggingService.logEvent({
        type: 'REFRESH_TOKEN_ROTATED',
        level: LogLevel.INFO,
        userId: user.id,
        context: { sessionId: session.id },
      });

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user,
      };
    } catch (error) {
      await this.loggingService.logEvent({
        type: 'REFRESH_TOKEN_FAILED',
        level: LogLevel.WARN,
        context: { message: (error as Error).message },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(request: RequestWithCookies) {
    try {
      const refreshToken = request.cookies?.refresh_token;

      if (!refreshToken) {
        throw new UnauthorizedException('No refresh token provided');
      }

      const sessionContext = this.requestContextService.snapshot();
      const { session } = await this.sessionService.validateRefreshToken(
        refreshToken,
        sessionContext,
      );

      await this.sessionService.revokeSession(session.id);

      await this.loggingService.logEvent({
        type: 'LOGOUT_SUCCESS',
        level: LogLevel.INFO,
        userId: session.userId,
        context: { sessionId: session.id },
      });

      return { message: 'Logged out successfully' };
    } catch (error) {
      await this.loggingService.logEvent({
        type: 'LOGOUT_FAILED',
        level: LogLevel.WARN,
        context: { message: (error as Error).message },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logoutFromAllDevices(request: RequestWithCookies) {
    try {
      const refreshToken = request.cookies?.refresh_token;

      if (!refreshToken) {
        throw new UnauthorizedException('No refresh token provided');
      }

      const sessionContext = this.requestContextService.snapshot();
      const { payload } = await this.sessionService.validateRefreshToken(
        refreshToken,
        sessionContext,
      );

      await this.sessionService.revokeAllSessionsForUser(payload.sub);
      await this.loggingService.logEvent({
        type: 'LOGOUT_ALL_DEVICES',
        level: LogLevel.INFO,
        userId: payload.sub,
      });
    } catch (error) {
      await this.loggingService.logEvent({
        type: 'LOGOUT_ALL_DEVICES_FAILED',
        level: LogLevel.WARN,
        context: { message: (error as Error).message },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getSessions(userId: string) {
    return this.sessionService.getSessionsForUser(userId);
  }

  async revokeSessionById(request: RequestWithCookies, sessionId: string) {
    const refreshToken = request.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const sessionContext = this.requestContextService.snapshot();
    const { payload } = await this.sessionService.validateRefreshToken(
      refreshToken,
      sessionContext,
    );

    const session = await this.sessionService.findSessionById(sessionId);

    if (!session || session.userId !== payload.sub) {
      await this.loggingService.logEvent({
        type: 'SESSION_REVOKE_UNAUTHORIZED',
        level: LogLevel.WARN,
        userId: payload.sub,
        context: { targetSessionId: sessionId },
      });
      throw new UnauthorizedException('Session not found');
    }

    if (session.revokedAt) {
      return { message: 'Session already revoked' };
    }

    await this.sessionService.revokeSession(sessionId);

    await this.loggingService.logEvent({
      type: 'SESSION_REVOKED',
      level: LogLevel.INFO,
      userId: payload.sub,
      context: { sessionId },
    });

    return { message: 'Session revoked successfully' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    await this.usersService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );

    await this.loggingService.logEvent({
      type: 'PASSWORD_CHANGED',
      level: LogLevel.INFO,
      userId,
    });

    return { message: 'Password updated successfully' };
  }
}
