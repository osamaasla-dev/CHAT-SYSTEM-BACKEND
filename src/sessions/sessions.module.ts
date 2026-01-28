import { Module } from '@nestjs/common';
import { SessionRepository } from './repositories/session.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CommonModule } from 'src/common/common.module';
import { LoggingModule } from 'src/logging/logging.module';
import { TokenModule } from 'src/auth/modules/token/token.module';
import { SessionLifecycleService } from './services/session-lifecycle.service';
import { SessionRevocationService } from './services/session-revocation.service';
import { SessionSecurityService } from './services/session-security.service';
import { SessionQueryService } from './services/session-query.service';
import { SessionLoggingService } from './services/session-logging.service';

@Module({
  imports: [PrismaModule, CommonModule, LoggingModule, TokenModule],
  providers: [
    SessionRepository,
    SessionLifecycleService,
    SessionRevocationService,
    SessionSecurityService,
    SessionQueryService,
    SessionLoggingService,
  ],
  exports: [
    SessionLifecycleService,
    SessionRevocationService,
    SessionSecurityService,
    SessionQueryService,
  ],
})
export class SessionsModule {}
