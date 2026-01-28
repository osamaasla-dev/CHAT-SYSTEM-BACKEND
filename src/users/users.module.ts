import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';
import { UserAuthAccountService } from './features/auth/user-auth-account.service';
import { UserAuthPasswordService } from './features/auth/user-auth-password.service';
import { UserAuthEmailService } from './features/auth/user-auth-email.service';
import { ProfileModule } from './features/profile/profile.module';

@Module({
  imports: [PrismaModule, ProfileModule],
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
