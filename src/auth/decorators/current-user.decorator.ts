import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { CurrentUserType, RequestWithUser } from '../types/auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserType => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
