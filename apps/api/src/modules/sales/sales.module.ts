import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { SalesController } from "./sales.controller";
import { SalesService } from "./sales.service";
import { RequestsModule } from "../requests/requests.module";

@Module({
  imports: [PrismaModule, RequestsModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
