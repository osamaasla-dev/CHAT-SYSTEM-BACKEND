import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { SessionRepository } from './repositories/session.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CommonModule } from 'src/common/common.module';
import { LoggingModule } from 'src/logging/logging.module';
import { TokenModule } from 'src/auth/modules/token/token.module';

@Module({
  imports: [PrismaModule, CommonModule, LoggingModule, TokenModule],
  providers: [SessionsService, SessionRepository],
  controllers: [SessionsController],
  exports: [SessionsService],
})
export class SessionsModule {}
