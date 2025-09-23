import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const getDatabaseSSL = (isProduction: boolean): false | { rejectUnauthorized: false } => {
  if (isProduction || process.env.DB_SSL === 'true') {
    return { rejectUnauthorized: false };
  }
  return false;
};

const getConnectionPoolConfig = () => ({
  connectionLimit: 10,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
});

const getBaseConfig = (
  isDevelopment: boolean,
  _isProduction: boolean,
): Partial<TypeOrmModuleOptions> => ({
  type: 'mysql' as const,
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
  charset: 'utf8mb4',
  timezone: '+00:00',
  extra: getConnectionPoolConfig(),
});

export default registerAs('database', (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  // AWS RDS MySQL URL 사용 (있는 경우)
  const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (databaseUrl) {
    const url = new URL(databaseUrl);
    return {
      ...getBaseConfig(isDevelopment, isProduction),
      host: url.hostname,
      port: parseInt(url.port, 10) || 3306,
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: getDatabaseSSL(isProduction),
    } as TypeOrmModuleOptions;
  }

  // 기존 개별 환경변수 사용
  return {
    ...getBaseConfig(isDevelopment, isProduction),
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'triad_db',
    ssl: getDatabaseSSL(isProduction),
  } as TypeOrmModuleOptions;
});
