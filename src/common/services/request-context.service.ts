import { Injectable, Scope } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface RequestContextSnapshot {
  requestId?: string;
  userId?: string | null;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  requestStartedAt?: number;
  context?: Prisma.InputJsonValue;
}

@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  private readonly state: RequestContextSnapshot = {};

  set<K extends keyof RequestContextSnapshot>(
    key: K,
    value: RequestContextSnapshot[K],
  ) {
    this.state[key] = value;
  }

  merge(payload: Partial<RequestContextSnapshot>) {
    Object.assign(this.state, payload);
  }

  get<K extends keyof RequestContextSnapshot>(
    key: K,
  ): RequestContextSnapshot[K] {
    return this.state[key];
  }

  snapshot(): RequestContextSnapshot {
    return { ...this.state };
  }
}
