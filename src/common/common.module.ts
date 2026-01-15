import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RequestContextService } from './services/request-context.service';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { RequestContextInterceptor } from './interceptors/request-context.interceptor';

@Module({
  imports: [PrismaModule],
  providers: [
    RequestContextService,
    RequestContextMiddleware,
    RequestContextInterceptor,
  ],
  exports: [
    RequestContextService,
    RequestContextMiddleware,
    RequestContextInterceptor,
  ],
})
export class CommonModule {}
