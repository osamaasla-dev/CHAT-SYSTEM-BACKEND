import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { TokenModule } from '../token/token.module';
import { UsersModule } from 'src/users/users.module';
import { LoggingModule } from 'src/logging/logging.module';
import { SessionLoggingService } from './services/session-logging.service';
import { LogoutService } from './services/logout.service';
import { LogoutAllDevicesService } from './services/logout-all-devices.service';
import { RefreshTokensService } from './services/refresh-tokens.service';
import { TokenIntrospectionService } from './services/token-introspection.service';
import { AuthSessionService } from './auth-session.service';

@Module({
  imports: [
    CommonModule,
    SessionsModule,
    TokenModule,
    UsersModule,
    LoggingModule,
  ],
  providers: [
    AuthSessionService,
    SessionLoggingService,
    LogoutService,
    LogoutAllDevicesService,
    RefreshTokensService,
    TokenIntrospectionService,
  ],
  exports: [AuthSessionService],
})
export class AuthSessionModule {}
