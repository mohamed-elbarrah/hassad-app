'use client'

import { RoleGuard } from '@/components/common/RoleGuard'
import { UserRole } from '@hassad/shared'

export default function ProjectsPage() {
  return (
    <RoleGuard allowedRoles={[UserRole.PM, UserRole.ADMIN, UserRole.EMPLOYEE]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Projects Management</h1>
        </div>
        
        <div className="bg-white p-8 rounded-xl border shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <h2 className="text-xl font-semibold">Projects Workspace</h2>
          <p className="text-muted-foreground max-w-md">
            This page allows managers and employees to track project progress and milestones.
            Accessible to PM, Admin, and Employees.
          </p>
        </div>
      </div>
    </RoleGuard>
  )
}
