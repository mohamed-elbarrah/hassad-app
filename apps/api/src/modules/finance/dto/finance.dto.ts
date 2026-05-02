import { IsString, IsNumber, IsUUID, IsDateString, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@hassad/shared';

export class InvoiceItemDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsString()
  description: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Type(() => Number)
  unitPrice: number;

  @IsNumber()
  @Type(() => Number)
  total: number;
}

export class CreateInvoiceDto {
  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  contractId?: string;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];
}

export class RegisterPaymentDto {
  @IsUUID()
  invoiceId: string;

  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

export class CreateEmployeeDto {
  @IsString()
  name: string;

  @IsString()
  role: string;

  @IsNumber()
  baseSalary: number;

  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class RunPayrollDto {
  @IsNumber()
  month: number;

  @IsNumber()
  year: number;
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
