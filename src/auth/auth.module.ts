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

@Module({
  imports: [
    forwardRef(() => UsersModule),
    CommonModule,
    LoggingModule,
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
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    AccessTokenService,
    RefreshTokenService,
    TokenManagerService,
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
  ],
})
export class AuthModule {}
