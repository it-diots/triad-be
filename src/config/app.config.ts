import { registerAs } from '@nestjs/config';

const getThrottleLimit = (isProduction: boolean): number => {
  const envLimit = process.env.THROTTLE_LIMIT;
  if (envLimit) {
    return parseInt(envLimit, 10);
  }
  return isProduction ? 100 : 10;
};

const isSwaggerEnabled = (isProduction: boolean): boolean => {
  const envEnabled = process.env.SWAGGER_ENABLED;
  if (envEnabled) {
    return envEnabled === 'true';
  }
  return !isProduction;
};

const getLogLevel = (isProduction: boolean): string =>
  process.env.LOG_LEVEL || (isProduction ? 'warn' : 'debug');

export default registerAs('app', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    environment: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    throttle: {
      ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
      limit: getThrottleLimit(isProduction),
    },
    swagger: {
      enabled: isSwaggerEnabled(isProduction),
      path: process.env.SWAGGER_PATH || 'api/docs',
    },
    logging: {
      level: getLogLevel(isProduction),
    },
    // Vercel 관련 설정
    vercel: {
      enabled: isVercel,
      maxDuration: 30, // Vercel 함수 최대 실행 시간 (초)
    },
  };
});
