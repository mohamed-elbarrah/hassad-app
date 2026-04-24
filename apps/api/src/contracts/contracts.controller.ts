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
import { ContractsService } from "./contracts.service";
import { CreateContractDto } from "./dto/create-contract.dto";
import { UpdateContractDto } from "./dto/update-contract.dto";
import { ContractFiltersDto } from "./dto/contract-filters.dto";
import { SignContractDto } from "./dto/sign-contract.dto";
import type { JwtPayload } from "../common/decorators/current-user.decorator";

@Controller("contracts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.ACCOUNTANT)
  findAll(
    @Query() filters: ContractFiltersDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contractsService.findAll(filters, user);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.ACCOUNTANT)
  findOne(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.contractsService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateContractDto, @CurrentUser() user: JwtPayload) {
    return this.contractsService.create(dto, user);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.SALES)
  update(
    @Param("id") id: string,
    @Body() dto: UpdateContractDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contractsService.update(id, dto, user);
  }

  @Post(":id/send")
  @Roles(UserRole.ADMIN, UserRole.SALES)
  @HttpCode(HttpStatus.OK)
  send(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.contractsService.send(id, user);
  }

  @Post(":id/sign")
  @Roles(UserRole.ADMIN, UserRole.SALES)
  @HttpCode(HttpStatus.OK)
  sign(
    @Param("id") id: string,
    @Body() dto: SignContractDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contractsService.sign(id, dto, user);
  }
}
