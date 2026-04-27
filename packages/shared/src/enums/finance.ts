export enum InvoiceStatus {
  DUE = 'DUE',
  SENT = 'SENT',
  PAID = 'PAID',
  LATE = 'LATE',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  APPLE_PAY = 'APPLE_PAY',
  MADA = 'MADA',
  VISA_MC = 'VISA_MC',
  TABBY = 'TABBY',
  TAMARA = 'TAMARA',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum TicketStatus {
  PENDING = 'PENDING',
  COLLECTION = 'COLLECTION',
  PAID = 'PAID',
  LATE = 'LATE',
}
