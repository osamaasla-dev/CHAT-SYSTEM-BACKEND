import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SessionsModule } from 'src/sessions/sessions.module';
import { SearchUserByUsernameService } from './services/search-user-by-username.service';
import { UsersModule } from 'src/users/users.module';
import { forwardRef } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [forwardRef(() => UsersModule), SessionsModule, CommonModule],
  controllers: [SearchController],
  providers: [SearchUserByUsernameService],
})
export class SearchModule {}
