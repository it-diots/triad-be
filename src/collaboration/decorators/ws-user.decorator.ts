import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { User } from '../../users/entities/user.entity';

interface WsData {
  user?: User;
  [key: string]: unknown;
}

// NestJS 데코레이터는 PascalCase를 사용하는 것이 관례입니다
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CurrentWsUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    const data = ctx.switchToWs().getData<WsData>();
    return data?.user;
  },
);
