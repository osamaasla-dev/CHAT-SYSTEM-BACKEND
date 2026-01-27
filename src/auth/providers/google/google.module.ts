import { Module } from '@nestjs/common';
import { GoogleService } from './google.service';
import { GoogleInitService } from './services/google-init.service';
import { RedisModule } from 'src/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { GoogleController } from './google.controller';
import { GoogleCallbackService } from './services/google-callback.service';
import { AuthProviderRepository } from './repository/auth-provider.repository';
import { GoogleOAuthService } from './services/google-oauth.service';
import { GoogleUserResolverService } from './services/google-user-resolver.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { GoogleLoggingService } from './services/google-logging.service';
import { LoggingModule } from 'src/logging/logging.module';
import { TokenModule } from 'src/auth/modules/token/token.module';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    RedisModule,
    PrismaModule,
    TokenModule,
    CommonModule,
    SessionsModule,
    LoggingModule,
  ],
  providers: [
    GoogleService,
    GoogleInitService,
    GoogleCallbackService,
    GoogleOAuthService,
    GoogleUserResolverService,
    AuthProviderRepository,
    GoogleLoggingService,
  ],
  exports: [GoogleService, AuthProviderRepository],
  controllers: [GoogleController],
})
export class GoogleModule {}
