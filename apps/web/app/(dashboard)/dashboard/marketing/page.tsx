'use client'

import { RoleGuard } from '@/components/common/RoleGuard'
import { UserRole } from '@hassad/shared'

export default function MarketingPage() {
  return (
    <RoleGuard allowedRoles={[UserRole.MARKETING, UserRole.ADMIN]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Marketing Campaigns</h1>
        </div>
        
        <div className="bg-white p-8 rounded-xl border shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v10"/><path d="M18.4 4.6a9 9 0 1 1-12.8 0"/></svg>
          </div>
          <h2 className="text-xl font-semibold">Marketing Workspace</h2>
          <p className="text-muted-foreground max-w-md">
            Track campaign KPIs and manage marketing activities.
            Accessible only to Marketing Managers and Admins.
          </p>
        </div>
      </div>
    </RoleGuard>
  )
}
