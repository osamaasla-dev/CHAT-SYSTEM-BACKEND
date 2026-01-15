import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ProfileController } from './features/profile.controller';
import { ProfileService } from './features/profile.service';
import { AuthModule } from '../auth/auth.module';
import { UsersRepository } from './repositories/users.repository';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [UsersController, ProfileController],
  providers: [UsersService, ProfileService, UsersRepository],
  exports: [UsersService, UsersRepository, ProfileService],
})
export class UsersModule {}
