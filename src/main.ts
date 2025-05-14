import * as dotenv from 'dotenv';
// Load environment variables from .env file first
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import cookieSession from 'cookie-session';
import { configuration, validateEnvVariables } from './config/configuration';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import passport from 'passport';

async function bootstrap() {
  // Validate environment variables before starting the application
  validateEnvVariables();
  
  const app = await NestFactory.create(AppModule);
  const config = configuration();

  app.use(
    cookieSession({
      name: 'session',
      keys: ['your-secret-key'],
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'none',
      secure: false,
    })    
  );
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Always allow these origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  });
  app.use(passport.initialize());
  app.use(passport.session());

  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true,
    transform: true,
    exceptionFactory: (errors) => {
      const messages = errors.map(error => ({
        field: error.property,
        message: Object.values(error.constraints).join(', '),
      }));
      return {
        statusCode: 400,
        message: 'Validation failed',
        error: 'Bad Request',
        details: messages,
      };
    },
  }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(helmet());

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  await app.listen(config.port);
}
bootstrap();
