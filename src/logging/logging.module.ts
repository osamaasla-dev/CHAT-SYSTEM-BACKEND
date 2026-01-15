import { Module } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}
