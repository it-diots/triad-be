/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable max-lines-per-function */

import * as fs from 'fs';
import * as path from 'path';

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import MarkdownIt from 'markdown-it';

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

const loadSequenceDiagram = (): string => {
  try {
    const sequencePath = path.join(process.cwd(), 'sequence.md');
    const markdownContent = fs.readFileSync(sequencePath, 'utf-8');

    // Markdown-it 설정
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str: string, lang: string): string => {
        if (lang === 'mermaid') {
          return `<pre class="mermaid">${str}</pre>`;
        }
        return `<pre><code class="language-${lang || 'plaintext'}">${str}</code></pre>`;
      },
    });

    return md.render(markdownContent);
  } catch (error) {
    console.error('Failed to load sequence.md:', error);
    return '';
  }
};

const getSwaggerCustomJs = (sequenceHtml: string): string => `
  // Sequence diagram 삽입 스크립트
  (function() {
    const sequenceHtml = ${JSON.stringify(sequenceHtml)};

    // DOM이 로드될 때까지 대기
    const insertSequenceDiagram = () => {
      // Schemas 섹션을 찾기
      const schemasSection = document.querySelector('.models.is-open') ||
                            document.querySelector('.models');

      if (schemasSection) {
        // 이미 삽입되었는지 확인
        if (document.getElementById('sequence-diagram-container')) {
          return;
        }

        // 컨테이너 생성
        const container = document.createElement('div');
        container.id = 'sequence-diagram-container';
        container.className = 'sequence-diagram-section';
        container.innerHTML = sequenceHtml;

        // Schemas 섹션 바로 위에 삽입
        schemasSection.parentNode.insertBefore(container, schemasSection);

        // Mermaid 다이어그램 렌더링
        if (typeof mermaid !== 'undefined') {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
          });
          mermaid.run({
            querySelector: '.sequence-diagram-section .mermaid',
          });
        }
      }
    };

    // MutationObserver로 DOM 변경 감지
    const observer = new MutationObserver((mutations) => {
      insertSequenceDiagram();
    });

    // 페이지 로드 후 실행
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        setTimeout(insertSequenceDiagram, 1000);
      });
    } else {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      setTimeout(insertSequenceDiagram, 1000);
    }
  })();
`;

const getSwaggerCustomCss = (): string => `
        .sequence-diagram-section {
          margin: 20px 0;
          padding: 20px;
          background: #fafafa;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }
        .sequence-diagram-section h1 {
          color: #333;
          font-size: 24px;
          margin-bottom: 15px;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 10px;
        }
        .sequence-diagram-section h2 {
          color: #555;
          font-size: 20px;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        .sequence-diagram-section h3 {
          color: #666;
          font-size: 18px;
          margin-top: 15px;
          margin-bottom: 10px;
        }
        .sequence-diagram-section pre.mermaid {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
        }
        .sequence-diagram-section table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .sequence-diagram-section table th,
        .sequence-diagram-section table td {
          padding: 10px;
          text-align: left;
          border: 1px solid #ddd;
        }
        .sequence-diagram-section table th {
          background: #f0f0f0;
          font-weight: bold;
        }
        .sequence-diagram-section code {
          background: #f4f4f4;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
        .sequence-diagram-section ul,
        .sequence-diagram-section ol {
          margin-left: 20px;
          margin-bottom: 10px;
        }
        .sequence-diagram-section li {
          margin-bottom: 5px;
        }
        .swagger-ui .scheme-container {
          background: #fafafa;
          padding: 15px;
        }
`;

const setupSwagger = (
  app: NestExpressApplication,
  configService: ConfigService,
  logger: Logger,
): void => {
  const isSwaggerEnabled = configService.get<boolean>('app.swagger.enabled', true);

  if (!isSwaggerEnabled) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Triad API')
    .setDescription('웹 개발 협업 툴 API 문서')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const swaggerPath = configService.get<string>('app.swagger.path', 'api/docs');

  // Sequence diagram HTML 로드
  const sequenceHtml = loadSequenceDiagram();

  // Swagger UI 커스터마이징
  SwaggerModule.setup(swaggerPath, app, document, {
    customCss: getSwaggerCustomCss(),
    customJs: [
      // Mermaid CDN
      'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js',
    ],
    customJsStr: getSwaggerCustomJs(sequenceHtml),
  });

  logger.log(`Swagger documentation available at: /${swaggerPath}`);
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
