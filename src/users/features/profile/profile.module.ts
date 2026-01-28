import { forwardRef, Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { GetMyProfileService } from './services/get-my-profile.service';
import { UsersModule } from 'src/users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ChangeProfileNameService } from './services/change-profile-name.service';
import { ModerationModule } from 'src/moderation/moderation.module';
import { MediaModule } from 'src/media/media.module';
import { ChangeProfileAvatarService } from './services/change-profile-avatar.service';
import { DeleteProfileAvatarService } from './services/delete-profile-avatar.service';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PrismaModule,
    ModerationModule,
    MediaModule,
  ],
  controllers: [ProfileController],
  providers: [
    GetMyProfileService,
    ChangeProfileNameService,
    ChangeProfileAvatarService,
    DeleteProfileAvatarService,
  ],
})
export class ProfileModule {}
