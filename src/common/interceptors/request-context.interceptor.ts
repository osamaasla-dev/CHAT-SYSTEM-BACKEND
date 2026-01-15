import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Scope,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { RequestWithUser } from '../../auth/types/auth.types';
import { RequestContextService } from '../services/request-context.service';

@Injectable({ scope: Scope.REQUEST })
export class RequestContextInterceptor implements NestInterceptor {
  constructor(private readonly requestContext: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.id ?? null;
    this.requestContext.set('userId', userId);
    return next.handle();
  }
}
