import { Module, forwardRef } from '@nestjs/common';
import { PasswordLoggingService } from './services/password-logging.service';
import { ChangePasswordService } from './services/change-password.service';
import { RequestPasswordResetService } from './services/request-reset-password.service';
import { ResetPasswordService } from './services/reset-password.service';
import { UsersModule } from 'src/users/users.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { CommonModule } from 'src/common/common.module';
import { MailModule } from 'src/mail/mail.module';
import { LoggingModule } from 'src/logging/logging.module';
import { PasswordController } from './password.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    SessionsModule,
    CommonModule,
    MailModule,
    LoggingModule,
  ],
  providers: [
    PasswordLoggingService,
    ChangePasswordService,
    RequestPasswordResetService,
    ResetPasswordService,
  ],
  controllers: [PasswordController],
})
export class PasswordModule {}
