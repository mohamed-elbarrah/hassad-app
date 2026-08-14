import { Controller, Get, Param, Post, Body, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { ResolveContractMigrationReviewDto } from "../dto/contract-migration-review.dto";
import { AdminContractMigrationReviewService } from "../services/admin-contract-migration-review.service";

@Controller("admin/contracts/migration-reviews")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminContractMigrationReviewController {
  constructor(private readonly service: AdminContractMigrationReviewService) {}

  @Get()
  @RequirePermissions("admin.contracts.read")
  findAll(@Query("includeResolved") includeResolved?: string) {
    return this.service.findAll(includeResolved === "true");
  }

  @Post(":id/create-request")
  @RequirePermissions("admin.contracts.intervene")
  createRequest(@Param("id") id: string, @CurrentUser("id") adminId: string) {
    return this.service.createRequestForUnmatchedContract(id, adminId);
  }

  @Post(":id/resolve")
  @RequirePermissions("admin.contracts.intervene")
  resolve(
    @Param("id") id: string,
    @Body() dto: ResolveContractMigrationReviewDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.resolve(id, dto, adminId);
  }
}
