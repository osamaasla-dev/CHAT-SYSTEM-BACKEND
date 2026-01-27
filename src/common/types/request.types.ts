import { FastifyRequest } from 'fastify';

export type RequestWithCookies = FastifyRequest & {
  cookies?: Record<string, string | undefined>;
};
