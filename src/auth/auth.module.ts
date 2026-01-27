import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtSessionGuard } from './guards/jwt-session.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthSessionModule } from './modules/session/auth-session.module';
import { GoogleModule } from './providers/google/google.module';
import { TokenModule } from './modules/token/token.module';
import { PasswordModule } from './modules/password/password.module';
import { EmailModule } from './modules/email/email.module';
import { MfaModule } from './modules/mfa/mfa.module';
import { AccountModule } from './modules/account/account.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule,
    PrismaModule,
    TokenModule,
    AuthSessionModule,
    GoogleModule,
    PasswordModule,
    EmailModule,
    MfaModule,
    AccountModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    JwtSessionGuard,
    RolesGuard,
  ],
  exports: [JwtAuthGuard, JwtSessionGuard, RolesGuard],
})
export class AuthModule {}
