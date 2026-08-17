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
import {
  CreateRequestContactLogDto,
  CreateRequestDto,
  UpdateRequestStatusDto,
} from "./dto/request.dto";
import { CreateRequestForClientDto } from "./dto/request-for-client.dto";
import { RequestsService } from "./requests.service";

@Controller("requests")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @RequirePermissions("requests.read")
  findAll(@Query() filters: any) {
    return this.requestsService.findAll(filters);
  }

  @Get(":id")
  @RequirePermissions("requests.read")
  findOne(@Param("id") id: string) {
    return this.requestsService.findOne(id);
  }

  @Post()
  @RequirePermissions("requests.create")
  create(@CurrentUser() user: any, @Body() dto: CreateRequestDto) {
    return this.requestsService.createPortalRequest(
      { id: user.id, role: user.role },
      dto,
    );
  }

  @Post(":id/status")
  @RequirePermissions("requests.update")
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

  @Post(":id/contact-log")
  @RequirePermissions("requests.update")
  addContactLog(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateRequestContactLogDto,
  ) {
    return this.requestsService.addContactLog(id, user.id, dto);
  }

  @Get(":id/contact-log")
  @RequirePermissions("requests.read")
  getContactLogs(@Param("id") id: string) {
    return this.requestsService.getContactLogs(id);
  }

  @Post("for-client")
  @RequirePermissions("requests.create")
  createForClient(
    @CurrentUser() user: any,
    @Body() dto: CreateRequestForClientDto,
  ) {
    return this.requestsService.createForClient(dto, user.id);
  }
}
