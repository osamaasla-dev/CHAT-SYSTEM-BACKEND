import { Module, forwardRef } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { SessionRepository } from './repositories/session.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    LoggingModule,
    forwardRef(() => AuthModule),
  ],
  providers: [SessionsService, SessionRepository],
  controllers: [SessionsController],
  exports: [SessionsService],
})
export class SessionsModule {}
