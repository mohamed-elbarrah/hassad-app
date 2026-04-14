'use client'

import { RoleGuard } from '@/components/common/RoleGuard'
import { UserRole } from '@hassad/shared'

export default function CRMPage() {
  return (
    <RoleGuard allowedRoles={[UserRole.SALES, UserRole.ADMIN]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-primary">CRM & Sales Pipeline</h1>
        </div>
        
        <div className="bg-white p-8 rounded-xl border shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h2 className="text-xl font-semibold">CRM Workspace</h2>
          <p className="text-muted-foreground max-w-md">
            This page is dedicated to managing leads, clients, and sales pipelines.
            Only Sales and Admin roles have access.
          </p>
        </div>
      </div>
    </RoleGuard>
  )
}
