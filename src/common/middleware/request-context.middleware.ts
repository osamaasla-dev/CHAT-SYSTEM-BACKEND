import { Injectable, NestMiddleware } from '@nestjs/common';
import type {
  FastifyRequest,
  FastifyReply,
  HookHandlerDoneFunction,
} from 'fastify';
import { randomUUID } from 'crypto';
import { RequestContextService } from '../services/request-context.service';

type FastifyRequestWithContext = FastifyRequest & {
  requestId?: string;
  startTime?: number;
};

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(
    req: FastifyRequestWithContext,
    res: FastifyReply,
    next: HookHandlerDoneFunction,
  ): void {
    const requestId =
      (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
    const startTime = Date.now();
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    req.requestId = requestId;
    req.startTime = startTime;

    this.requestContext.merge({
      requestId,
      ip,
      userAgent,
      method: req.method,
      path: req.url,
      requestStartedAt: startTime,
    });

    const finishEmitter:
      | { on: (event: string, cb: () => void) => void }
      | undefined =
      'raw' in res && res.raw && typeof res.raw.on === 'function'
        ? res.raw
        : typeof (res as unknown as { on?: unknown }).on === 'function'
          ? (res as unknown as { on: (event: string, cb: () => void) => void })
          : undefined;

    finishEmitter?.on('finish', () => {
      this.requestContext.merge({
        statusCode: res.statusCode,
        durationMs: Date.now() - startTime,
      });
    });

    next();
  }
}
