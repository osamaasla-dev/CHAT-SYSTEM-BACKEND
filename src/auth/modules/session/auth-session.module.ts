import { forwardRef, Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { TokenModule } from '../token/token.module';
import { UsersModule } from 'src/users/users.module';
import { LoggingModule } from 'src/logging/logging.module';
import { SessionLoggingService } from './services/session-logging.service';
import { LogoutService } from './services/logout.service';
import { LogoutAllDevicesService } from './services/logout-all-devices.service';
import { RefreshTokensService } from './services/refresh-tokens.service';
import { IntrospectTokenService } from './services/introspect-token.service';
import { SessionController } from './session.controller';
import { RevokeSessionService } from './services/revoke-session.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    CommonModule,
    SessionsModule,
    TokenModule,
    UsersModule,
    LoggingModule,
  ],
  providers: [
    SessionLoggingService,
    LogoutService,
    LogoutAllDevicesService,
    RefreshTokensService,
    IntrospectTokenService,
    RevokeSessionService,
  ],
  controllers: [SessionController],
})
export class AuthSessionModule {}
