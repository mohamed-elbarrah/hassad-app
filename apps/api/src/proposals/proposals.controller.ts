import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserRole } from "@hassad/shared";
import { ProposalsService } from "./proposals.service";
import { CreateProposalDto } from "./dto/create-proposal.dto";
import { UpdateProposalDto } from "./dto/update-proposal.dto";
import { ProposalFiltersDto } from "./dto/proposal-filters.dto";
import { ProposalResponseDto } from "./dto/proposal-response.dto";
import type { JwtPayload } from "../common/decorators/current-user.decorator";

@Controller("proposals")
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get("share/:token")
  getByShareToken(@Param("token") token: string) {
    return this.proposalsService.getByShareToken(token);
  }

  @Post("share/:token/approve")
  @HttpCode(HttpStatus.OK)
  approveByShareToken(
    @Param("token") token: string,
    @Body() dto: ProposalResponseDto,
  ) {
    return this.proposalsService.approveByShareToken(token, dto);
  }

  @Post("share/:token/revision")
  @HttpCode(HttpStatus.OK)
  requestRevisionByShareToken(
    @Param("token") token: string,
    @Body() dto: ProposalResponseDto,
  ) {
    return this.proposalsService.requestRevisionByShareToken(token, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findAll(
    @Query() filters: ProposalFiltersDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.proposalsService.findAll(filters, user);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findOne(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.proposalsService.findOne(id, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SALES)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProposalDto, @CurrentUser() user: JwtPayload) {
    return this.proposalsService.create(dto, user);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SALES)
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProposalDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.proposalsService.update(id, dto, user);
  }

  @Post(":id/send")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SALES)
  @HttpCode(HttpStatus.OK)
  send(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.proposalsService.send(id, user);
  }
}
