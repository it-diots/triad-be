import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';

import { AppModule } from './app.module';

import type { NestExpressApplication } from '@nestjs/platform-express';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: NestExpressApplication;

const isExtensionOrigin = (origin: string): boolean =>
  origin.startsWith('chrome-extension://') ||
  origin.startsWith('moz-extension://') ||
  origin.startsWith('ms-browser-extension://');

const isLocalOrigin = (origin: string): boolean =>
  origin.includes('localhost') || origin.includes('127.0.0.1');

const setupCors = (app: NestExpressApplication, isVercel: boolean): void => {
  const corsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ): void => {
      if (!origin) {
        return callback(null, true);
      }

      if (isExtensionOrigin(origin) || isLocalOrigin(origin)) {
        return callback(null, true);
      }

      if (isVercel) {
        return callback(null, true);
      }

      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'X-Extension-Id',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
  };

  app.enableCors(corsOptions);
};

const setupValidation = (app: NestExpressApplication): void => {
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
};

const setupSwagger = (
  app: NestExpressApplication,
  configService: ConfigService,
  logger?: Logger,
): void => {
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
};

const createNestApp = async (): Promise<NestExpressApplication> => {
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
};

// Vercel 서버리스 함수 핸들러
const handler = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
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
};

export default handler;

// 로컬 개발을 위한 기존 bootstrap 함수 유지
const bootstrap = async (): Promise<void> => {
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
};

// 로컬 개발 환경에서만 실행
if (!process.env.VERCEL) {
  bootstrap().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}
