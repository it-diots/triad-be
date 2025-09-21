import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const getDatabaseSSL = (isProduction: boolean): false | { rejectUnauthorized: false } => {
  if (isProduction || process.env.DB_SSL === 'true') {
    return { rejectUnauthorized: false };
  }
  return false;
};

const getConnectionPoolConfig = (isVercel: boolean) => ({
  max: isVercel ? 1 : 10,
  connectionTimeoutMillis: isVercel ? 5000 : 1000,
  idleTimeoutMillis: isVercel ? 30000 : 60000,
  acquireTimeoutMillis: isVercel ? 10000 : 60000,
});

const getBaseConfig = (
  isDevelopment: boolean,
  isProduction: boolean,
  isVercel: boolean,
): Partial<TypeOrmModuleOptions> => ({
  type: 'postgres' as const,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: isDevelopment,
  logging: isDevelopment,
  logger: 'advanced-console' as const,
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  autoLoadEntities: true,
  cache: {
    duration: 60000,
  },
  ssl: getDatabaseSSL(isProduction),
  extra: getConnectionPoolConfig(isVercel),
});

export default registerAs('database', (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Supabase DATABASE_URL 사용 (있는 경우)
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

  if (databaseUrl) {
    const url = new URL(databaseUrl);
    return {
      ...getBaseConfig(isDevelopment, isProduction, isVercel),
      host: url.hostname,
      port: parseInt(url.port, 10),
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1),
    } as TypeOrmModuleOptions;
  }

  // 기존 개별 환경변수 사용
  return {
    ...getBaseConfig(isDevelopment, isProduction, isVercel),
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'triad_db',
  } as TypeOrmModuleOptions;
});
