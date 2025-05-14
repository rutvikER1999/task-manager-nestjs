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
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Default error response
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details = null;

    // Handle HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || exception.name;
        details = (exceptionResponse as any).details || null;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } 
    // Handle Mongoose validation errors
    else if ((exception as any).name === 'ValidationError') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      error = 'Validation Error';
      details = this.formatMongooseValidationError(exception);
    }
    // Handle Mongoose duplicate key errors
    else if ((exception as any).code === 11000) {
      status = HttpStatus.CONFLICT;
      message = 'Duplicate entry';
      error = 'Duplicate Error';
      details = this.formatMongooseDuplicateError(exception);
    }
    // Handle JWT errors
    else if ((exception as any).name === 'JsonWebTokenError') {
      status = HttpStatus.UNAUTHORIZED;
      message = 'Invalid token';
      error = 'Authentication Error';
    }
    else if ((exception as any).name === 'TokenExpiredError') {
      status = HttpStatus.UNAUTHORIZED;
      message = 'Token expired';
      error = 'Authentication Error';
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : 'Unknown error',
    );

    // Send response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      details,
    });
  }

  private formatMongooseValidationError(exception: any): any {
    const errors = {};
    for (const field in exception.errors) {
      errors[field] = {
        message: exception.errors[field].message,
        kind: exception.errors[field].kind,
      };
    }
    return errors;
  }

  private formatMongooseDuplicateError(exception: any): any {
    const keyValue = exception.keyValue;
    const field = Object.keys(keyValue)[0];
    return {
      field,
      value: keyValue[field],
      message: `Duplicate value for ${field}`,
    };
  }
} 