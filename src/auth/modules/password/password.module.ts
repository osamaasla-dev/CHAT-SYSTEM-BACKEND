import { Module, forwardRef } from '@nestjs/common';
import { PasswordService } from './password.service';
import { PasswordManagementService } from './services/password-management.service';
import { PasswordLoggingService } from './services/password-logging.service';
import { UsersModule } from 'src/users/users.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { CommonModule } from 'src/common/common.module';
import { MailModule } from 'src/mail/mail.module';
import { LoggingModule } from 'src/logging/logging.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    SessionsModule,
    CommonModule,
    MailModule,
    LoggingModule,
  ],
  providers: [
    PasswordService,
    PasswordManagementService,
    PasswordLoggingService,
  ],
  exports: [PasswordService],
})
export class PasswordModule {}
