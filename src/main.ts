import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

import type { NestExpressApplication } from '@nestjs/platform-express';

const isExtensionOrigin = (origin: string): boolean =>
  origin.startsWith('chrome-extension://') ||
  origin.startsWith('moz-extension://') ||
  origin.startsWith('ms-browser-extension://');

const isLocalOrigin = (origin: string): boolean =>
  origin.includes('localhost') || origin.includes('127.0.0.1');

const setupCors = (app: NestExpressApplication, isProduction: boolean): void => {
  const corsOrigin = process.env.CORS_ORIGIN;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (isExtensionOrigin(origin)) {
        return callback(null, true);
      }
      if (!isProduction && isLocalOrigin(origin)) {
        return callback(null, true);
      }
      if (corsOrigin) {
        const allowedOrigins = corsOrigin.split(',').map((o) => o.trim());
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
      }
      if (!isProduction) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
};

const setupValidation = (app: NestExpressApplication): void => {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );
};

const setupSwagger = (
  app: NestExpressApplication,
  configService: ConfigService,
  logger: Logger,
): void => {
  const isSwaggerEnabled = configService.get<boolean>('app.swagger.enabled', true);

  if (isSwaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Triad API')
      .setDescription('웹 개발 협업 툴 API 문서')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const swaggerPath = configService.get<string>('app.swagger.path', 'api/docs');
    SwaggerModule.setup(swaggerPath, app, document);

    logger.log(`Swagger documentation available at: /${swaggerPath}`);
  }
};

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const isProduction = process.env.NODE_ENV === 'production';

  // Global prefix and versioning
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Setup middleware
  setupCors(app, isProduction);
  setupValidation(app);
  setupSwagger(app, configService, logger);

  // Start server
  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`Environment: ${configService.get<string>('app.environment', 'development')}`);
};

// 애플리케이션 시작
void bootstrap();
