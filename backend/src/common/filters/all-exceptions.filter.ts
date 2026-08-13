import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error occurred.';
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        errorDetails = (exceptionResponse as any).error || null;
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception on ${request.method} ${request.url}: ${exception.message}`, exception.stack);
      // In production, mask raw database or internal errors for OWASP security
      if (process.env.NODE_ENV === 'production') {
        message = 'An unexpected internal error occurred.';
      } else {
        message = exception.message;
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error: errorDetails,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
