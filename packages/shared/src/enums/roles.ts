export const UserRole = {
  ADMIN: 'ADMIN',
  PM: 'PM',
  SALES: 'SALES',
  EMPLOYEE: 'EMPLOYEE',
  MARKETING: 'MARKETING',
  ACCOUNTANT: 'ACCOUNTANT',
  CLIENT: 'CLIENT',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];
