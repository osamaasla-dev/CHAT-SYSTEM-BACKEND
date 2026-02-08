import { Module } from '@nestjs/common';
import { BlocksController } from './blocks.controller';
import { DeleteBlockService } from './services/delete-block.service';
import { CreateBlockService } from './services/create-block.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GetBlockedUsersService } from './services/get-blocked-users.service';
import { GetBlockedUsersCountService } from './services/get-blocked-users-count.service';
import { BlockRepository } from './repositories/block.repository';
import { SessionsModule } from 'src/sessions/sessions.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [PrismaModule, SessionsModule, CommonModule],
  controllers: [BlocksController],
  providers: [
    BlockRepository,
    GetBlockedUsersService,
    GetBlockedUsersCountService,
    DeleteBlockService,
    CreateBlockService,
  ],
})
export class BlocksModule {}
