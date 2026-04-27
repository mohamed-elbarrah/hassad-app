import { Module } from '@nestjs/common';
import { ProposalsController } from './controllers/proposals.controller';
import { ProposalsService } from './services/proposals.service';

@Module({
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
