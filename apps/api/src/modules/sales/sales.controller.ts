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
import { CreateRequestForClientDto } from "../requests/dto/request-for-client.dto";
import {
  CreateRequestContactLogDto,
  CreateRequestDto,
  UpdateRequestStatusDto,
} from "../requests/dto/request.dto";
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
  getMetrics(
    @Query() query: SalesPeriodQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const accessScope = this.salesService.getRequestAccessScope(user);
    return this.salesService.getMetrics(query.period, accessScope);
  }

  @Get("performance")
  @RequirePermissions("sales.read")
  getPerformance(
    @Query() query: SalesPeriodQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const accessScope = this.salesService.getRequestAccessScope(user);
    return this.salesService.getPerformance(query.period, accessScope);
  }

  @Get("activity")
  @RequirePermissions("sales.read")
  getActivity(
    @Query() query: SalesActivityQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const accessScope = this.salesService.getRequestAccessScope(user);
    return this.salesService.getActivity(query.limit ?? 20, accessScope);
  }

  @Post("requests")
  @RequirePermissions("requests.create")
  createSalesRequest(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateRequestDto,
  ) {
    return this.requestsService.createPortalRequest(
      { id: user.id, role: user.role },
      dto,
    );
  }

  @Post("requests/for-client")
  @RequirePermissions("requests.create")
  createSalesRequestForClient(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateRequestForClientDto,
  ) {
    const accessScope = this.salesService.getRequestAccessScope(user);
    return this.requestsService.createForClient(dto, user.id, accessScope);
  }

  @Get("requests/:id")
  @RequirePermissions("requests.read")
  async getSalesRequest(
    @Param() params: RequestIdParamDto,
    @CurrentUser() user: AuthUser,
  ) {
    const canUpdateStatus =
      await this.requestsService.canUserUpdateStatus(user);
    const accessScope = this.salesService.getRequestAccessScope(user);
    return this.requestsService.findOne(
      params.id,
      {
        canLogContact: canUpdateStatus,
        canUpdateStatus,
      },
      accessScope,
    );
  }

  @Get("pipeline")
  @RequirePermissions("requests.read")
  async getPipeline(
    @Query() filters: SalesPipelineQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const canUpdateStatus =
      await this.requestsService.canUserUpdateStatus(user);
    const accessScope = this.salesService.getRequestAccessScope(user);

    return this.requestsService.findSalesPipeline(
      filters,
      canUpdateStatus,
      accessScope,
    );
  }

  @Post("pipeline/:id/contact-log")
  @RequirePermissions("requests.update")
  addPipelineContactLog(
    @Param() params: RequestIdParamDto,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateRequestContactLogDto,
  ) {
    const accessScope = this.salesService.getRequestAccessScope(user);
    return this.requestsService.addContactLog(
      params.id,
      user.id,
      dto,
      accessScope,
    );
  }

  @Post("pipeline/:id/status")
  @RequirePermissions("requests.update")
  changePipelineStatus(
    @Param() params: RequestIdParamDto,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateRequestStatusDto,
  ) {
    const accessScope = this.salesService.getRequestAccessScope(user);
    return this.requestsService
      .changeStatus(
        params.id,
        dto.toStatus,
        user.id,
        dto.note,
        undefined,
        accessScope,
      )
      .then((request) => ({
        request,
        allowedNextStatuses: getAllowedRequestTransitions(
          request.status as unknown as RequestStatus,
        ),
      }));
  }
}
