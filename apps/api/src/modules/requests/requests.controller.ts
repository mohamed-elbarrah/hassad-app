import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CreateRequestDto, UpdateRequestStatusDto } from "./dto/request.dto";
import { RequestsService } from "./requests.service";

@Controller("requests")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @RequirePermissions("leads.read")
  findAll(@Query() filters: any) {
    return this.requestsService.findAll(filters);
  }

  @Get(":id")
  @RequirePermissions("leads.read")
  findOne(@Param("id") id: string) {
    return this.requestsService.findOne(id);
  }

  @Post()
  @RequirePermissions("leads.create")
  create(@CurrentUser() user: any, @Body() dto: CreateRequestDto) {
    return this.requestsService.createPortalRequest(
      { id: user.id, role: user.role },
      dto,
    );
  }

  @Post(":id/status")
  @RequirePermissions("leads.update")
  changeStatus(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateRequestStatusDto,
  ) {
    return this.requestsService.changeStatus(
      id,
      dto.toStatus,
      user.id,
      dto.note,
    );
  }
}
