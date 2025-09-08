import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export default registerAs(
  'jwt',
  (): JwtModuleOptions => ({
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    signOptions: {
      expiresIn: process.env.JWT_EXPIRATION || '7d',
      issuer: 'triad-api',
      algorithm: 'HS256',
    },
  }),
);

export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
  expiresIn: process.env.JWT_EXPIRATION || '7d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
};
