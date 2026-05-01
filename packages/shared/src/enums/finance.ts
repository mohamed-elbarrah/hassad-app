export enum InvoiceStatus {
  DUE = 'DUE',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  PENDING = 'PENDING',
  LATE = 'LATE',
  CANCELLED = 'CANCELLED',
}

export enum SalaryStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  APPLE_PAY = 'APPLE_PAY',
  MADA = 'MADA',
  VISA_MC = 'VISA_MC',
  TABBY = 'TABBY',
  TAMARA = 'TAMARA',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  CASH = 'CASH',
}

export enum TicketStatus {
  PENDING = 'PENDING',
  COLLECTION = 'COLLECTION',
  PAID = 'PAID',
  LATE = 'LATE',
}

export enum PaymentGatewayType {
  ONLINE = 'ONLINE',
  MANUAL = 'MANUAL',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentEventType {
  CREATED = 'CREATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}
