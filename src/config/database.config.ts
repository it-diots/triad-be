import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const getDatabaseSSL = (isProduction: boolean): false | { rejectUnauthorized: false } => {
  if (isProduction || process.env.DB_SSL === 'true') {
    return { rejectUnauthorized: false };
  }
  return false;
};

const getConnectionPoolConfig = (isVercel: boolean) => {
  return {
    max: isVercel ? 1 : 10,
    connectionTimeoutMillis: isVercel ? 5000 : 1000,
    idleTimeoutMillis: isVercel ? 30000 : 60000,
    acquireTimeoutMillis: isVercel ? 10000 : 60000,
  };
};

export default registerAs('database', (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'triad_db',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: isDevelopment,
    logging: isDevelopment,
    logger: 'advanced-console',
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
    autoLoadEntities: true,
    cache: {
      duration: 60000, // 1 minute cache
    },
    ssl: getDatabaseSSL(isProduction),
    extra: getConnectionPoolConfig(isVercel),
  };
});
