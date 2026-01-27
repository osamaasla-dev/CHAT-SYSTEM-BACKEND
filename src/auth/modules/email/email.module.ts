import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { VerifyEmailService } from './services/verify-email.service';
import { ChangeEmailService } from './services/change-email.service';
import { EmailLoggingService } from './services/email-logging.service';
import { UsersModule } from 'src/users/users.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { CommonModule } from 'src/common/common.module';
import { MailModule } from 'src/mail/mail.module';
import { LoggingModule } from 'src/logging/logging.module';

@Module({
  imports: [
    UsersModule,
    SessionsModule,
    CommonModule,
    MailModule,
    LoggingModule,
  ],
  providers: [
    EmailService,
    VerifyEmailService,
    ChangeEmailService,
    EmailLoggingService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
