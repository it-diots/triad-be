import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import express from 'express';

import { AppModule } from './app.module';

import type { NestExpressApplication } from '@nestjs/platform-express';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: NestExpressApplication;

function setupCors(app: NestExpressApplication, isVercel: boolean): void {
  app.enableCors({
    origin: isVercel ? true : process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: isVercel
      ? ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control']
      : ['Content-Type', 'Authorization'],
  });
}

function setupValidation(app: NestExpressApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
}

function setupSwagger(
  app: NestExpressApplication,
  configService: ConfigService,
  logger?: Logger,
): void {
  const swaggerEnabled = configService.get<boolean>('app.swagger.enabled', true);
  if (!swaggerEnabled) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Triad API')
    .setDescription('Web collaboration tool API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Projects', 'Project management endpoints')
    .addTag('Collaboration', 'Real-time collaboration endpoints')
    .addTag('Comments', 'Comment management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const swaggerPath = configService.get<string>('app.swagger.path', 'api/docs');
  SwaggerModule.setup(swaggerPath, app, document);

  if (logger) {
    logger.log(`Swagger documentation available at /${swaggerPath}`);
  }
}

async function createNestApp(): Promise<NestExpressApplication> {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
    {
      logger: ['error', 'warn', 'log'],
    },
  );

  const configService = app.get(ConfigService);

  // Global prefix and versioning
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Setup middleware
  setupCors(app, true);
  setupValidation(app);
  setupSwagger(app, configService);

  await app.init();
  cachedApp = app;
  return app;
}

// Vercel 서버리스 함수 핸들러
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const app = await createNestApp();
  const expressApp = app.getHttpAdapter().getInstance();

  return new Promise((resolve, reject) => {
    const expressHandler = expressApp as (
      req: unknown,
      res: unknown,
      next?: (err?: unknown) => void,
    ) => void;
    expressHandler(req, res, (err?: unknown) => {
      if (err) {
        reject(new Error(err instanceof Error ? err.message : 'Unknown error'));
      } else {
        resolve();
      }
    });
  });
}

// 로컬 개발을 위한 기존 bootstrap 함수 유지
async function bootstrap(): Promise<void> {
  if (process.env.VERCEL) {
    return;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Global prefix and versioning
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Setup middleware
  setupCors(app, false);
  setupValidation(app);
  setupSwagger(app, configService, logger);

  // Start server
  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`Environment: ${configService.get<string>('app.environment', 'development')}`);
}

// 로컬 개발 환경에서만 실행
if (!process.env.VERCEL) {
  bootstrap().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}
