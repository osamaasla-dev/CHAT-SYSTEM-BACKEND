import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpErrorFilter } from './common/filters/http-exception.filter';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: true,
      bodyLimit: 50 * 1024 * 1024,
    }),
  );

  await app.register(cookie);
  await app.register(multipart);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpErrorFilter());
  await app.listen(4000, '0.0.0.0');
}
void bootstrap();
