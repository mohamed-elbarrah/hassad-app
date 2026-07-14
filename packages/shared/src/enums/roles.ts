export const UserRole = {
  ADMIN: "ADMIN",
  PM: "PM",
  SALES: "SALES",
  TEAM: "TEAM",
  MARKETING: "MARKETING",
  ACCOUNTANT: "ACCOUNTANT",
  CLIENT: "CLIENT",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLE_AR: Record<UserRole, string> = {
  ADMIN: "مدير النظام",
  PM: "مدير مشروع",
  SALES: "مبيعات",
  TEAM: "فريق",
  MARKETING: "تسويق",
  ACCOUNTANT: "محاسب",
  CLIENT: "عميل",
};
