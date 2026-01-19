import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AccessTokenService } from './services/access-token.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { TokenManagerService } from './services/token-manager.service';
import { JwtSessionGuard } from './guards/jwt-session.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { SessionsModule } from '../sessions/sessions.module';
import { CommonModule } from '../common/common.module';
import { LoggingModule } from '../logging/logging.module';
import { UsersModule } from '../users/users.module';
import { SignupService } from './services/use-cases/signup.service';
import { LoginService } from './services/use-cases/login.service';
import { RefreshTokensService } from './services/use-cases/refresh-tokens.service';
import { LogoutService } from './services/use-cases/logout.service';
import { LogoutAllDevicesService } from './services/use-cases/logout-all-devices.service';
import { AuthSessionsService } from './services/use-cases/sessions.service';
import { AuthLoggingService } from './services/auth-logging.service';
import { PasswordManagementService } from './services/use-cases/password-management.service';
import { MailModule } from '../mail/mail.module';
import { EmailTokenService } from './services/use-cases/email-token.service';
import { VerifyEmailService } from './services/use-cases/verify-email.service';
import { ChangeEmailService } from './services/use-cases/change-email.service';
import { CreateMfaChallengeService } from './services/use-cases/create-mfa-challenge.service';
import { VerifyMfaChallengeService } from './services/use-cases/verify-mfa-challenge.service';
import { TokenIntrospectionService } from './services/use-cases/token-introspection.service';
import { RedisModule } from 'src/redis/redis.module';
import { SocialAuthModule } from './providers/social-auth/social-auth.module';

@Module({
  imports: [
    MailModule,
    forwardRef(() => UsersModule),
    CommonModule,
    LoggingModule,
    RedisModule,
    PassportModule,
    PrismaModule,
    forwardRef(() => SessionsModule),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
    SocialAuthModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    AccessTokenService,
    RefreshTokenService,
    TokenManagerService,
    EmailTokenService,
    SignupService,
    LoginService,
    RefreshTokensService,
    LogoutService,
    LogoutAllDevicesService,
    AuthSessionsService,
    AuthLoggingService,
    VerifyEmailService,
    PasswordManagementService,
    ChangeEmailService,
    TokenIntrospectionService,
    CreateMfaChallengeService,
    VerifyMfaChallengeService,
    JwtAuthGuard,
    JwtSessionGuard,
    RolesGuard,
  ],
  exports: [
    JwtAuthGuard,
    JwtSessionGuard,
    RolesGuard,
    TokenManagerService,
    AccessTokenService,
    RefreshTokenService,
    EmailTokenService,
    AuthLoggingService,
  ],
})
export class AuthModule {}
