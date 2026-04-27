import { IsString, IsNumber, IsUUID, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod, TicketStatus } from '@hassad/shared';

export class CreateInvoiceDto {
  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  contractId?: string;

  @IsString()
  invoiceNumber: string;

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
