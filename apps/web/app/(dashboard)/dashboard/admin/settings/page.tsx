'use client'

import { RoleGuard } from '@/components/common/RoleGuard'
import { UserRole } from '@hassad/shared'

export default function AdminSettingsPage() {
  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-primary font-mono lowercase">Admin Settings</h1>
        </div>
        
        <div className="bg-white p-8 rounded-xl border-2 border-dashed border-destructive/20 flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-destructive/10 text-destructive rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <h2 className="text-xl font-semibold">Security & System Workspace</h2>
          <p className="text-muted-foreground max-w-md">
            Manage user roles, system configurations, and platform-wide settings.
            <span className="block mt-2 font-bold text-destructive underline">
              WARNING: ONLY ACCESSIBLE TO SUPER ADMINS
            </span>
          </p>
        </div>
      </div>
    </RoleGuard>
  )
}
