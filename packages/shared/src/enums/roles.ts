export const UserRole = {
  ADMIN: "ADMIN",
  PM: "PM",
  SALES: "SALES",
  EMPLOYEE: "EMPLOYEE",
  MARKETING: "MARKETING",
  ACCOUNTANT: "ACCOUNTANT",
  CLIENT: "CLIENT",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLE_AR: Record<UserRole, string> = {
  ADMIN: "مدير النظام",
  PM: "مدير مشروع",
  SALES: "مبيعات",
  EMPLOYEE: "موظف",
  MARKETING: "تسويق",
  ACCOUNTANT: "محاسب",
  CLIENT: "عميل",
};
