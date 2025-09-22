import { IncomingMessage, ServerResponse } from 'http';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';

import { AppModule } from '../src/app.module';

const expressApp = express();

export default async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  if (!expressApp.get('nestApp')) {
    const adapter = new ExpressAdapter(expressApp);
    const app = await NestFactory.create(AppModule, adapter, {
      logger: ['error', 'warn'],
    });

    const configService = app.get(ConfigService);

    // CORS 설정
    app.enableCors({
      origin: configService.get<string>('CORS_ORIGIN', '*').split(','),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });

    // 전역 파이프 설정
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Swagger 설정 (개발 환경에서만)
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Triad API')
        .setDescription('웹 개발 협업 툴 API 문서')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
    }

    await app.init();
    expressApp.set('nestApp', app);
  }

  return expressApp(req, res) as void;
};
