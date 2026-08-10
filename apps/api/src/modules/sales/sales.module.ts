import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { SalesClientsController } from "./controllers/sales-clients.controller";
import { SalesController } from "./sales.controller";
import { SalesClientsService } from "./services/sales-clients.service";
import { SalesService } from "./sales.service";

@Module({
  imports: [PrismaModule],
  controllers: [SalesController, SalesClientsController],
  providers: [SalesService, SalesClientsService],
})
export class SalesModule {}
