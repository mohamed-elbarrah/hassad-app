'use client'

import { RoleGuard } from '@/components/common/RoleGuard'
import { UserRole } from '@hassad/shared'

export default function FinancePage() {
  return (
    <RoleGuard allowedRoles={[UserRole.ACCOUNTANT, UserRole.ADMIN]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Finance & Invoicing</h1>
        </div>
        
        <div className="bg-white p-8 rounded-xl border shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h2 className="text-xl font-semibold">Financial Workspace</h2>
          <p className="text-muted-foreground max-w-md">
            Manage invoices, expenses, and financial reports here.
            Accessible only to Accountants and Admins.
          </p>
        </div>
      </div>
    </RoleGuard>
  )
}
