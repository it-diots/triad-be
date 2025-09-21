import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
// NestJS 데코레이터는 PascalCase를 사용하는 것이 관례입니다
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
