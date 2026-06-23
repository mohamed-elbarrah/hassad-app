import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from "@nestjs/common";
import { DisputesService } from "../services/disputes.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import {
  CreateDisputeDto,
  CreateDisputeMessageDto,
  ClientConfirmDto,
  DisputeFilterDto,
} from "../dto";

@Controller("portal/disputes")
@UseGuards(JwtAuthGuard)
export class PortalDisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  async createDispute(
    @CurrentUser("clientId") clientId: string,
    @Body() dto: CreateDisputeDto,
  ) {
    return this.disputesService.createDispute(clientId, dto);
  }

  @Get()
  async getClientDisputes(
    @CurrentUser("clientId") clientId: string,
    @Query() filter: DisputeFilterDto,
  ) {
    return this.disputesService.getClientDisputes(clientId, filter);
  }

  @Get(":id")
  async getDisputeById(
    @CurrentUser("clientId") clientId: string,
    @Param("id") id: string,
  ) {
    return this.disputesService.getClientDisputeById(clientId, id);
  }

  @Post(":id/messages")
  async addMessage(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: CreateDisputeMessageDto,
  ) {
    return this.disputesService.addMessage(id, userId, dto);
  }

  @Post(":id/confirm")
  async confirmResolution(
    @CurrentUser("clientId") clientId: string,
    @Param("id") id: string,
    @Body() dto: ClientConfirmDto,
  ) {
    return this.disputesService.clientConfirmResolution(clientId, id, dto);
  }
}