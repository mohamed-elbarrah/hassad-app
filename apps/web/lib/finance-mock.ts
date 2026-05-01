"use client";

export const FINANCE_DATA = {
  summary: {
    totalRevenue: 1250000,
    paidInvoices: 850000,
    pendingInvoices: 350000,
    failedPayments: 50000,
    monthlyProfit: 120000,
    totalExpenses: 450000, // salaries + others
  },
  cashFlow: [
    { month: 'يناير', income: 100000, expenses: 80000 },
    { month: 'فبراير', income: 120000, expenses: 85000 },
    { month: 'مارس', income: 90000, expenses: 75000 },
    { month: 'أبريل', income: 150000, expenses: 90000 },
    { month: 'مايو', income: 130000, expenses: 88000 },
  ],
  alerts: [
    { id: 'a1', type: 'OVERDUE', client: 'مطعم ريف العرب', amount: 10000, date: '2024-04-20', status: 'UNPAID', severity: 'HIGH' },
    { id: 'a2', type: 'FAILED', client: 'شركة أبعاد', amount: 5000, date: '2024-04-25', status: 'FAILED', severity: 'MEDIUM' },
    { id: 'a3', type: 'CONTRACT_UNPAID', client: 'متجر السعادة', amount: 25000, date: '2024-04-15', status: 'PENDING', severity: 'LOW' },
  ],
  invoices: [
    {
      id: "INV-2024-001",
      clientName: "مطعم ريف العرب",
      contractName: "عقد توريد أغذية",
      amount: 10000,
      paidAmount: 6000,
      status: "PARTIAL",
      dueDate: "2024-05-15",
      createdAt: "2024-04-01",
    },
    {
      id: "INV-2024-002",
      clientName: "شركة أبعاد العقارية",
      contractName: "هوية بصرية",
      amount: 15000,
      paidAmount: 15000,
      status: "PAID",
      dueDate: "2024-04-10",
      createdAt: "2024-03-20",
    },
    {
      id: "INV-2024-003",
      clientName: "متجر السعادة",
      contractName: "حملة تسويقية",
      amount: 8000,
      paidAmount: 0,
      status: "PENDING",
      dueDate: "2024-05-01",
      createdAt: "2024-04-20",
    }
  ],
  payments: [
    { id: "PAY-001", invoiceId: "INV-2024-001", clientName: "مطعم ريف العرب", amount: 3000, method: "تحويل بنكي", status: "SUCCESS", date: "2024-04-05" },
    { id: "PAY-002", invoiceId: "INV-2024-001", clientName: "مطعم ريف العرب", amount: 3000, method: "نقدي", status: "SUCCESS", date: "2024-04-15" },
    { id: "PAY-003", invoiceId: "INV-2024-002", clientName: "شركة أبعاد العقارية", amount: 15000, method: "Stripe", status: "SUCCESS", date: "2024-04-10" },
    { id: "PAY-004", invoiceId: "INV-2024-003", clientName: "متجر السعادة", amount: 8000, method: "تحويل بنكي", status: "FAILED", date: "2024-04-25" },
  ],
  contracts: [
    { id: "CTR-001", name: "عقد توريد أغذية", clientName: "مطعم ريف العرب", totalValue: 20000, paid: 6000, remaining: 14000, status: "PARTIAL" },
    { id: "CTR-002", name: "هوية بصرية", clientName: "شركة أبعاد العقارية", totalValue: 15000, paid: 15000, remaining: 0, status: "PAID" },
    { id: "CTR-003", name: "حملة تسويقية", clientName: "متجر السعادة", totalValue: 30000, paid: 0, remaining: 30000, status: "UNPAID" },
  ],
  employees: [
    {
      id: "EMP-001",
      name: "أحمد محمد",
      role: "مدير مشاريع",
      baseSalary: 5000,
      bonuses: 500,
      deductions: 100,
      lastPayment: "2024-04-01",
      status: "PAID",
      history: [
        { id: "SP-001", amount: 5400, date: "2024-04-01", status: "SUCCESS", method: "تحويل بنكي" },
        { id: "SP-002", amount: 5000, date: "2024-03-01", status: "SUCCESS", method: "تحويل بنكي" }
      ],
      timeline: [
        { id: 'et1', event: 'اعتماد الراتب من المدير المالي', date: '2024-03-28 09:00' },
        { id: 'et2', event: 'تم تحويل الراتب بنجاح', date: '2024-04-01 11:30' },
      ]
    },
    {
      id: "EMP-002",
      name: "سارة خالد",
      role: "مصممة جرافيك",
      baseSalary: 4000,
      bonuses: 0,
      deductions: 0,
      lastPayment: "2024-03-01",
      status: "PENDING",
      history: [
        { id: "SP-003", amount: 4000, date: "2024-03-01", status: "SUCCESS", method: "تحويل بنكي" }
      ],
      timeline: [
        { id: 'et3', event: 'تم إنشاء مسودة الراتب', date: '2024-04-25 14:00' },
      ]
    }
  ],
  ledger: [
    { id: 'L-001', action: 'إنشاء فاتورة', entity: 'INV-2024-001', user: 'نظام آلي', before: '-', after: '10,000 ر.س', date: '2024-04-01 10:00' },
    { id: 'L-002', action: 'تسجيل عملية دفع', entity: 'PAY-001', user: 'ليلى المحاسبة', before: '0 ر.س', after: '3,000 ر.س', date: '2024-04-05 14:30' },
    { id: 'L-003', action: 'تعديل راتب الموظف', entity: 'EMP-001', user: 'أحمد المدير', before: '4,500 ر.س', after: '5,000 ر.س', date: '2024-03-20 09:15' },
    { id: 'L-004', action: 'رفض عملية دفع', entity: 'PAY-004', user: 'بوابة الدفع', before: 'PENDING', after: 'FAILED', date: '2024-04-25 16:45' },
  ]
};

export type FinanceData = typeof FINANCE_DATA;
