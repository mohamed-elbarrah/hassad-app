import { Module } from '@nestjs/common';
import { PortalController } from './controllers/portal.controller';
import { PortalService } from './services/portal.service';

@Module({
  controllers: [PortalController],
  providers: [PortalService],
  exports: [PortalService],
})
export class PortalModule {}
