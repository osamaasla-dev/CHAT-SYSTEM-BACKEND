import { Module, forwardRef } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { CreateMfaChallengeService } from './services/create-mfa-challenge.service';
import { VerifyMfaChallengeService } from './services/verify-mfa-challenge.service';
import { MfaLoggingService } from './services/mfa-logging.service';
import { MailModule } from 'src/mail/mail.module';
import { RedisModule } from 'src/redis/redis.module';
import { CommonModule } from 'src/common/common.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { TokenModule } from '../token/token.module';
import { UsersModule } from 'src/users/users.module';
import { LoggingModule } from 'src/logging/logging.module';

@Module({
  imports: [
    MailModule,
    RedisModule,
    CommonModule,
    SessionsModule,
    TokenModule,
    forwardRef(() => UsersModule),
    LoggingModule,
  ],
  providers: [
    MfaService,
    CreateMfaChallengeService,
    VerifyMfaChallengeService,
    MfaLoggingService,
  ],
  exports: [MfaService],
})
export class MfaModule {}
