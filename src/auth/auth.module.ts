import { Module } from '@nestjs/common';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtSessionGuard } from './guards/jwt-session.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PassportModule } from '@nestjs/passport';
import { AccountModule } from './modules/account/account.module';
import { EmailModule } from './modules/email/email.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { MfaModule } from './modules/mfa/mfa.module';
import { PasswordModule } from './modules/password/password.module';
import { AuthSessionModule } from './modules/session/auth-session.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GoogleModule } from './providers/google/google.module';

@Module({
  imports: [
    PrismaModule,
    SessionsModule,
    PassportModule,
    GoogleModule,
    AccountModule,
    MfaModule,
    PasswordModule,
    EmailModule,
    AuthSessionModule,
  ],
  providers: [JwtStrategy, JwtAuthGuard, JwtSessionGuard, RolesGuard],
  exports: [JwtAuthGuard, JwtSessionGuard, RolesGuard],
})
export class AuthModule {}
