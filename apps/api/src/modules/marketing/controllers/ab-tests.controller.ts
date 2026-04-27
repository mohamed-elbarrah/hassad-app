import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MarketingService } from '../services/marketing.service';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('ab-tests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AbTestsController {
  constructor(private readonly marketingService: MarketingService) {}

  @Post(':id/stop')
  @RequirePermissions('marketing.manage_tests')
  stop(@Param('id') id: string, @Body('winningVariantId') winningVariantId: string) {
    return this.marketingService.stopAbTest(id, winningVariantId);
  }
}
