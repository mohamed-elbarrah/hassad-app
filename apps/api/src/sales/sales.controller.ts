import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserRole } from "@hassad/shared";
import { SalesService } from "./sales.service";
import type { JwtPayload } from "../common/decorators/current-user.decorator";

@Controller("sales")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get("metrics")
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getMetrics(@CurrentUser() user: JwtPayload) {
    return this.salesService.getMetrics(user);
  }
}
