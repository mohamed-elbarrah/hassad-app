import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('metrics')
  @RequirePermissions('sales.read')
  getMetrics() {
    return this.salesService.getMetrics();
  }

  @Get('performance')
  @RequirePermissions('sales.read')
  getPerformance(@Query('period') period?: string) {
    return this.salesService.getPerformance(period);
  }

  @Get('activity')
  @RequirePermissions('sales.read')
  getActivity(@Query('limit') limit?: string, @CurrentUser() user?: any) {
    return this.salesService.getActivity(Number(limit) || 20);
  }
}
