import { IsString, IsNumber, IsUUID, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod } from '@hassad/shared';

export class CreateInvoiceDto {
  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  contractId?: string;

  // invoiceNumber is auto-generated on backend — do not require from frontend
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsDateString()
  issueDate: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// DB PaymentTicket has: invoiceId (required), clientId, assignedTo?, status, notes?
// No amount or description fields exist in the schema
export class CreateTicketDto {
  @IsUUID()
  invoiceId: string;

  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
