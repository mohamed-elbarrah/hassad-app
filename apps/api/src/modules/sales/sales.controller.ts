import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { RequestStatus } from "@hassad/shared";
import { SalesService } from "./sales.service";
import { RequestsService } from "../requests/requests.service";
import { RequestIdParamDto } from "../requests/dto/request-query.dto";
import { UpdateRequestStatusDto } from "../requests/dto/request.dto";
import {
  SalesActivityQueryDto,
  SalesPeriodQueryDto,
  SalesPipelineQueryDto,
} from "./dto/sales-query.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { getAllowedRequestTransitions } from "../requests/request-workflow";

type AuthUser = {
  id: string;
  role?: string;
  permissions?: string[];
};

@Controller("sales")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly requestsService: RequestsService,
  ) {}

  @Get("metrics")
  @RequirePermissions("sales.read")
  getMetrics(@Query() query: SalesPeriodQueryDto) {
    return this.salesService.getMetrics(query.period);
  }

  @Get("performance")
  @RequirePermissions("sales.read")
  getPerformance(@Query() query: SalesPeriodQueryDto) {
    return this.salesService.getPerformance(query.period);
  }

  @Get("activity")
  @RequirePermissions("sales.read")
  getActivity(@Query() query: SalesActivityQueryDto) {
    return this.salesService.getActivity(query.limit ?? 20);
  }

  @Get("pipeline")
  @RequirePermissions("requests.read")
  async getPipeline(
    @Query() filters: SalesPipelineQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const canUpdateStatus =
      await this.requestsService.canUserUpdateStatus(user);

    return this.requestsService.findSalesPipeline(filters, canUpdateStatus);
  }

  @Post("pipeline/:id/status")
  @RequirePermissions("requests.update")
  changePipelineStatus(
    @Param() params: RequestIdParamDto,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateRequestStatusDto,
  ) {
    return this.requestsService
      .changeStatus(params.id, dto.toStatus, user.id, dto.note)
      .then((request) => ({
        request,
        allowedNextStatuses: getAllowedRequestTransitions(
          request.status as unknown as RequestStatus,
        ),
      }));
  }
}
