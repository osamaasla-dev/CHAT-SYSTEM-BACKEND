import { Module, forwardRef } from '@nestjs/common';
import { SocialAuthService } from './social-auth.service';
import { GoogleInitService } from './services/google-init.service';
import { RedisModule } from 'src/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../auth.module';
import { SocialAuthController } from './social-auth.controller';
import { GoogleCallbackService } from './services/google-callback.service';
import { AuthProviderRepository } from './repository/auth-provider.repository';
import { GoogleOAuthService } from './services/google-oauth.service';
import { GoogleUserResolverService } from './services/google-user-resolver.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { FrontendRedirectService } from './services/frontend-redirect.service';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    ConfigModule,
    forwardRef(() => AuthModule),
    RedisModule,
    PrismaModule,
    CommonModule,
    forwardRef(() => SessionsModule),
  ],
  providers: [
    SocialAuthService,
    GoogleInitService,
    GoogleCallbackService,
    GoogleOAuthService,
    GoogleUserResolverService,
    FrontendRedirectService,
    AuthProviderRepository,
  ],
  exports: [SocialAuthService, AuthProviderRepository],
  controllers: [SocialAuthController],
})
export class SocialAuthModule {}
