import { IsUUID } from "class-validator";

export class TapCheckoutDto {
  @IsUUID()
  invoiceId: string;
}
