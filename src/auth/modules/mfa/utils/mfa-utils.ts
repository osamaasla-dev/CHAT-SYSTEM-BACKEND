import { BadRequestException } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import type { UserPayload } from '../../../types/auth.types';
import { RedisService } from '../../../../redis/redis.service';
import type { RequestContextSnapshot } from '../../../../common/services/request-context.service';
import {
  MFA_CHALLENGE_NAMESPACE,
  MFA_CHALLENGE_TTL_SECONDS,
  MFA_CODE_LENGTH,
  MFA_USER_POINTER_NAMESPACE,
} from '../constants/mfa.constants';
import { RequestWithCookies } from 'src/common/types/request.types';
import { cryptoHash } from 'src/common/utils/crypto-hash';

export const MFA_TOKEN_COOKIE = 'mfa_token';
export const MFA_TEMP_SESSION_COOKIE = 'temp_session_id';

export const buildChallengeKey = (digest: string) =>
  `${MFA_CHALLENGE_NAMESPACE}:${digest}`;

export const buildUserPointerKey = (userId: string) =>
  `${MFA_USER_POINTER_NAMESPACE}:${userId}`;

export const generateNumericCode = (length = MFA_CODE_LENGTH): string => {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += (bytes[i] % 10).toString();
  }
  return code;
};

export interface MfaChallengeRecord {
  userId: string;
  codeDigest: string;
  createdAt: string;
  expiresAt: string;
}

export interface MfaTempSessionPayload extends UserPayload {
  loginRateLimitKey: string;
  sessionContext: RequestContextSnapshot;
}

export interface ResolvedTempSessionPayload {
  payload: MfaTempSessionPayload;
  hashedTempSessionId: string;
  tempSessionId: string;
}

interface TempSessionResolutionParams {
  request: RequestWithCookies;
  redisService: RedisService;
}

export const resolveTempSessionPayload = async ({
  request,
  redisService,
}: TempSessionResolutionParams): Promise<ResolvedTempSessionPayload> => {
  const tempSessionId = request?.cookies?.[MFA_TEMP_SESSION_COOKIE];
  if (!tempSessionId) {
    throw new BadRequestException('INVALID_MFA_TOKEN');
  }

  const hashedTempSessionId = cryptoHash(tempSessionId);
  const userPayload = await redisService.get<MfaTempSessionPayload | null>(
    hashedTempSessionId,
  );

  if (!userPayload) {
    throw new BadRequestException('INVALID_MFA_TOKEN');
  }

  return {
    payload: userPayload,
    hashedTempSessionId,
    tempSessionId,
  };
};

export const deleteExistingChallengeForUser = async (
  redisService: RedisService,
  userId: string,
) => {
  const pointerKey = buildUserPointerKey(userId);
  const existingDigest = await redisService.get<string>(pointerKey);

  if (existingDigest) {
    await redisService.delete(buildChallengeKey(existingDigest));
  }
};

export const setCookie = (
  key: string,
  token: string,
  response: FastifyReply,
  configService: ConfigService,
  maxAge = MFA_CHALLENGE_TTL_SECONDS,
) => {
  response.setCookie(key, token, {
    httpOnly: true,
    secure: configService.get<string>('NODE_ENV') === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
};

export const clearCookie = (
  key: string,
  response: FastifyReply,
  configService: ConfigService,
) => {
  response.clearCookie(key, {
    path: '/',
    sameSite: 'lax',
    secure: configService.get<string>('NODE_ENV') === 'production',
  });
};
