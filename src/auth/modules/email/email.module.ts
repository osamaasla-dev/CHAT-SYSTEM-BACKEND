import { forwardRef, Module } from '@nestjs/common';
import { VerifyEmailService } from './services/verify-email.service';
import { ChangeEmailService } from './services/change-email.service';
import { EmailLoggingService } from './services/email-logging.service';
import { UsersModule } from 'src/users/users.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { CommonModule } from 'src/common/common.module';
import { MailModule } from 'src/mail/mail.module';
import { LoggingModule } from 'src/logging/logging.module';
import { EmailController } from './email.controller';
import { AuthModule } from '../../auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    UsersModule,
    SessionsModule,
    CommonModule,
    MailModule,
    LoggingModule,
  ],
  providers: [VerifyEmailService, ChangeEmailService, EmailLoggingService],
  controllers: [EmailController],
})
export class EmailModule {}
