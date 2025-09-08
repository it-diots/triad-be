import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentWsUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToWs().getData()?.user;
  },
);