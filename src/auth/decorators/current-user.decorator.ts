import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { User } from '../../users/entities/user.entity';

// NestJS 데코레이터는 PascalCase를 사용하는 것이 관례입니다
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest<{ user: User }>();
  return request.user;
});
