import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProposalsService } from '../services/proposals.service';
import { CreateProposalDto } from '../dto/proposal.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('proposals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post()
  @RequirePermissions('proposals.create')
  create(@CurrentUser() user: any, @Body() createProposalDto: CreateProposalDto) {
    return this.proposalsService.create(user.id, createProposalDto);
  }

  @Get(':id')
  @RequirePermissions('proposals.read')
  findOne(@Param('id') id: string) {
    return this.proposalsService.findOne(id);
  }

  @Post(':id/send')
  @RequirePermissions('proposals.send')
  send(@Param('id') id: string) {
    return this.proposalsService.send(id);
  }

  @Post(':id/approve')
  @RequirePermissions('proposals.approve')
  approve(@Param('id') id: string) {
    return this.proposalsService.approve(id);
  }

  @Post(':id/reject')
  @RequirePermissions('proposals.reject')
  reject(@Param('id') id: string) {
    return this.proposalsService.reject(id);
  }
}
