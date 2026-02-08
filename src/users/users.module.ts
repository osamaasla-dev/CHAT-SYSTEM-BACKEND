import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';
import { UserAuthAccountService } from './features/credentials/user-auth-account.service';
import { UserAuthPasswordService } from './features/credentials/user-auth-password.service';
import { UserAuthEmailService } from './features/credentials/user-auth-email.service';
import { ProfileModule } from './features/profile/profile.module';
import { AccountModule } from './features/account/account.module';
import { SearchModule } from './features/search/search.module';

@Module({
  imports: [PrismaModule, ProfileModule, AccountModule, SearchModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    UserAuthAccountService,
    UserAuthPasswordService,
    UserAuthEmailService,
  ],
  exports: [
    UsersService,
    UsersRepository,
    UserAuthAccountService,
    UserAuthPasswordService,
    UserAuthEmailService,
  ],
})
export class UsersModule {}
