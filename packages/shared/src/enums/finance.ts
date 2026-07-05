export enum InvoiceStatus {
  DUE = "DUE",
  SENT = "SENT",
  PAID = "PAID",
  PARTIAL = "PARTIAL",
  PENDING = "PENDING",
  LATE = "LATE",
  CANCELLED = "CANCELLED",
}

export enum SalaryStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export enum PaymentMethod {
  APPLE_PAY = "APPLE_PAY",
  MADA = "MADA",
  VISA_MC = "VISA_MC",
  TABBY = "TABBY",
  TAMARA = "TAMARA",
  BANK_TRANSFER = "BANK_TRANSFER",
  CARD = "CARD",
  CASH = "CASH",
}

export enum TicketStatus {
  PENDING = "PENDING",
  COLLECTION = "COLLECTION",
  PAID = "PAID",
  LATE = "LATE",
}

export enum PaymentGatewayType {
  ONLINE = "ONLINE",
  MANUAL = "MANUAL",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum PaymentEventType {
  CREATED = "CREATED",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum PayType {
  FIXED = "FIXED",
  HOURLY = "HOURLY",
  COMMISSION = "COMMISSION",
  HYBRID = "HYBRID",
}

/**
 * When a planned payment becomes due / is issued.
 * - ON_SIGN    : issued immediately when the contract is signed (the down payment).
 * - PERIOD_END : issued when a billing period closes (recurring monthly retainers).
 * - MILESTONE : issued manually for fixed-scope milestones.
 * - MANUAL    : issued on demand by finance/sales.
 */
export enum PaymentPlanTriggerType {
  ON_SIGN = "ON_SIGN",
  PERIOD_END = "PERIOD_END",
  MILESTONE = "MILESTONE",
  MANUAL = "MANUAL",
}

/**
 * How a planned payment amount is expressed.
 * - PERCENT : a percentage of the contract `totalValue` (0-100).
 * - FIXED   : a fixed amount in the contract currency (SAR).
 */
export enum PaymentAmountType {
  PERCENT = "PERCENT",
  FIXED = "FIXED",
}

export const INVOICE_STATUS_AR: Record<InvoiceStatus, string> = {
  DUE: "مستحقة",
  SENT: "مرسلة",
  PAID: "مدفوعة",
  PARTIAL: "مدفوعة جزئياً",
  PENDING: "معلقة",
  LATE: "متأخرة",
  CANCELLED: "ملغية",
};

export const PAYMENT_STATUS_AR: Record<PaymentStatus, string> = {
  PENDING: "معلق",
  SUCCESS: "ناجح",
  FAILED: "فاشل",
  REFUNDED: "مسترجع",
};

export const TICKET_STATUS_AR: Record<TicketStatus, string> = {
  PENDING: "معلق",
  COLLECTION: "تحصيل",
  PAID: "مدفوع",
  LATE: "متأخر",
};
