import { ConfigService } from '@nestjs/config';
import {
  GOOGLE_STATE_NAMESPACE,
  GOOGLE_STATE_TOKEN_TTL_S,
} from '../constants/google';

export const buildGoogleStateKey = (digest: string): string =>
  `${GOOGLE_STATE_NAMESPACE}:${digest}`;

export const resolveGoogleStateTtlSeconds = (
  configService: ConfigService,
): number =>
  configService.get<number>('GOOGLE_STATE_TOKEN_TTL_S') ??
  GOOGLE_STATE_TOKEN_TTL_S;
