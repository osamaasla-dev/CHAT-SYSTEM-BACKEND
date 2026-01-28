import { Module, forwardRef } from '@nestjs/common';
import { SignupService } from './services/signup.service';
import { LoginService } from './services/login.service';
import { AccountLoggingService } from './services/account-logging.service';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { RedisModule } from 'src/redis/redis.module';
import { LoggingModule } from 'src/logging/logging.module';
import { MailModule } from 'src/mail/mail.module';
import { AccountController } from './account.controller';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    CommonModule,
    RedisModule,
    LoggingModule,
    MailModule,
  ],
  providers: [SignupService, LoginService, AccountLoggingService],
  controllers: [AccountController],
})
export class AccountModule {}
