import { forwardRef, Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { DeleteAccountService } from './services/delete-account.service';
import { CancelDeleteAccountService } from './services/cancel-delete-account.service';
import { DeactivateAccountService } from './services/deactivate-account.service';
import { ReactivateAccountService } from './services/reactivate-account.service';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { LoggingModule } from 'src/logging/logging.module';
import { SessionsModule } from 'src/sessions/sessions.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    SessionsModule,
    CommonModule,
    LoggingModule,
  ],
  controllers: [AccountController],
  providers: [
    DeleteAccountService,
    CancelDeleteAccountService,
    DeactivateAccountService,
    ReactivateAccountService,
  ],
})
export class AccountModule {}
