import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import type { ServerResponse } from 'http';

interface ErrorResponse {
  status: 'error';
  statusCode: number;
  message: string | string[];
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply | ServerResponse>();

    const { statusCode, message } = this.normalize(exception);

    const payload: ErrorResponse = {
      status: 'error',
      statusCode,
      message,
    };

    if ('code' in response && typeof response.code === 'function') {
      response.code(statusCode).send(payload);
      return;
    }

    if ('status' in response && typeof response.status === 'function') {
      response.status(statusCode).send(payload);
      return;
    }

    const rawResponse = response as ServerResponse;
    rawResponse.statusCode = statusCode;
    rawResponse.setHeader('Content-Type', 'application/json');
    rawResponse.end(JSON.stringify(payload));
  }

  private normalize(exception: unknown): {
    statusCode: number;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return { statusCode: status, message: response };
      }

      if (
        response &&
        typeof response === 'object' &&
        'message' in response &&
        response.message
      ) {
        return {
          statusCode: status,
          message: response.message as string | string[],
        };
      }

      return { statusCode: status, message: exception.message };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
