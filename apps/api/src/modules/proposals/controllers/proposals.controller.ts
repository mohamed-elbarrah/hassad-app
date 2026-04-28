import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { ProposalsService } from '../services/proposals.service';
import { CreateProposalDto, UpdateProposalDto, ProposalResponseDto } from '../dto/proposal.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

// ─── Multer storage config ────────────────────────────────────────────────────
const proposalStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'proposals'),
  filename: (_req, file, cb) => {
    const unique = randomBytes(16).toString('hex');
    const ext = extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

@Controller('proposals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post()
  @RequirePermissions('proposals.create')
  @UseInterceptors(FileInterceptor('file', { storage: proposalStorage }))
  async create(
    @CurrentUser() user: any,
    @Body() createProposalDto: CreateProposalDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }
    const filePath = `/uploads/proposals/${file.filename}`;
    return this.proposalsService.create(user.id, { ...createProposalDto, filePath });
  }

  @Get()
  @RequirePermissions('proposals.read')
  findAll(@Query() filters: any) {
    return this.proposalsService.findAll(filters);
  }

  @Get('my')
  @RequirePermissions('proposals.read_public')
  getMyProposals(@CurrentUser() user: any) {
    return this.proposalsService.getMyProposals(user.id);
  }

  @Get('share/:token')
  @RequirePermissions('proposals.read_public')
  findByToken(@Param('token') token: string) {
    return this.proposalsService.findByToken(token);
  }

  @Get(':id')
  @RequirePermissions('proposals.read')
  findOne(@Param('id') id: string) {
    return this.proposalsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('proposals.update')
  update(@Param('id') id: string, @Body() dto: UpdateProposalDto) {
    return this.proposalsService.update(id, dto);
  }

  @Post(':id/send')
  @RequirePermissions('proposals.send')
  send(@Param('id') id: string) {
    return this.proposalsService.send(id);
  }

  @Post(':id/approve')
  @RequirePermissions('proposals.approve')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.proposalsService.approve(id, user.id);
  }

  @Post(':id/reject')
  @RequirePermissions('proposals.reject')
  reject(@Param('id') id: string) {
    return this.proposalsService.reject(id);
  }

  @Post('share/:token/approve')
  @RequirePermissions('proposals.read_public')
  approveByToken(@Param('token') token: string, @Body() dto: ProposalResponseDto) {
    return this.proposalsService.approveByToken(token, dto.notes);
  }

  @Post('share/:token/revision')
  @RequirePermissions('proposals.read_public')
  revisionByToken(@Param('token') token: string, @Body() dto: ProposalResponseDto) {
    return this.proposalsService.revisionByToken(token, dto.notes);
  }
}
