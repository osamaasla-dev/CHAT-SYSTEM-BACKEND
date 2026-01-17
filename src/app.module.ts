import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from './common/common.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestContextInterceptor } from './common/interceptors/request-context.interceptor';
import { SessionsModule } from './sessions/sessions.module';
import { LoggingModule } from './logging/logging.module';
import { MailModule } from './mail/mail.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),
    UsersModule,
    AuthModule,
    CommonModule,
    SessionsModule,
    LoggingModule,
    MailModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
