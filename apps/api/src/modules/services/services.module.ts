import { Module } from '@nestjs/common';
import { ServiceCatalogController } from './controllers/service-catalog.controller';
import { ServiceCatalogService } from './services/service-catalog.service';

@Module({
  controllers: [ServiceCatalogController],
  providers: [ServiceCatalogService],
  exports: [ServiceCatalogService],
})
export class ServicesModule {}