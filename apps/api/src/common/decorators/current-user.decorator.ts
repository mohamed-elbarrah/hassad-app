import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@hassad/shared';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as JwtPayload;
  },
);
