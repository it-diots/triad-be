import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export default registerAs(
  'jwt',
  (): JwtModuleOptions & { refreshSecret: string; refreshExpiresIn: string } => ({
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
    signOptions: {
      expiresIn: (process.env.JWT_EXPIRATION || '7d') as `${number}d` | `${number}m` | `${number}h`,
      issuer: 'triad-api',
      algorithm: 'HS256',
    },
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
  }),
);

export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
  expiresIn: process.env.JWT_EXPIRATION || '7d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
};
