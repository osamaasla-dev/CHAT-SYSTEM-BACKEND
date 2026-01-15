import { Injectable, Logger, Scope } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogLevel, Prisma } from '@prisma/client';
import { RequestContextService } from '../common/services/request-context.service';

export interface LogEventOptions {
  userId?: string | null;
  type: string;
  level?: LogLevel;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  context?: Prisma.InputJsonValue;
}

@Injectable({ scope: Scope.REQUEST })
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  async logEvent(options: LogEventOptions): Promise<void> {
    const contextSnapshot = this.requestContext.snapshot();

    const resolvedLevel = options.level ?? LogLevel.INFO;
    const resolvedUserId = options.userId ?? contextSnapshot.userId ?? null;
    const resolvedRequestId = options.requestId ?? contextSnapshot.requestId;
    const resolvedIp = options.ip ?? contextSnapshot.ip;
    const resolvedUserAgent = options.userAgent ?? contextSnapshot.userAgent;
    const resolvedMethod = options.method ?? contextSnapshot.method;
    const resolvedPath = options.path ?? contextSnapshot.path;
    const resolvedStatusCode = options.statusCode ?? contextSnapshot.statusCode;
    const resolvedDuration = options.durationMs ?? contextSnapshot.durationMs;

    const normalizedContext: Prisma.InputJsonValue | undefined =
      options.context ??
      contextSnapshot.context ??
      (resolvedUserAgent
        ? ({ userAgent: resolvedUserAgent } as Prisma.InputJsonValue)
        : undefined);

    const userLabel = resolvedUserId ?? 'unknown';
    const logMessage = `[${options.type}] user=${userLabel} ip=${resolvedIp ?? 'unknown'} method=${resolvedMethod ?? 'N/A'} path=${resolvedPath ?? 'N/A'}`;

    switch (resolvedLevel) {
      case LogLevel.WARN:
        this.logger.warn(logMessage, resolvedUserAgent);
        break;
      case LogLevel.ERROR:
      case LogLevel.AUDIT:
        this.logger.error(logMessage, '', resolvedUserAgent);
        break;
      default:
        this.logger.log(logMessage, resolvedUserAgent);
    }

    await this.prisma.log.create({
      data: {
        level: resolvedLevel,
        message: options.type,
        userId: resolvedUserId,
        context: normalizedContext,
        requestId: resolvedRequestId,
        ip: resolvedIp,
        method: resolvedMethod,
        path: resolvedPath,
        statusCode: resolvedStatusCode,
        durationMs: resolvedDuration,
      },
    });
  }
}
