import { Module } from '@nestjs/common';
import { MarketingController } from './controllers/marketing.controller';
import { AbTestsController } from './controllers/ab-tests.controller';
import { MarketingService } from './services/marketing.service';

@Module({
  controllers: [MarketingController, AbTestsController],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
