'use client'

import { useAppSelector } from '@/lib/hooks'
import { UserRole } from '@hassad/shared'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      switch (user.role) {
        case UserRole.SALES:
          router.push('/dashboard/crm')
          break
        case UserRole.PM:
          router.push('/dashboard/projects')
          break
        case UserRole.EMPLOYEE:
          router.push('/dashboard/tasks')
          break
        case UserRole.MARKETING:
          router.push('/dashboard/marketing')
          break
        case UserRole.ACCOUNTANT:
          router.push('/dashboard/finance')
          break
        case UserRole.ADMIN:
          // Admin can stay on the main dashboard or be redirected to a default section
          // For now, let's just stay or provide a links to everything
          break
        default:
          break
      }
    }
  }, [mounted, isAuthenticated, user, router])

  if (!mounted || !isAuthenticated) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Overview</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder for stats cards */}
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Welcome</h3>
          <p className="text-2xl font-bold mt-2">{user?.name || 'User'}</p>
          <p className="text-xs text-muted-foreground mt-1">Role: {user?.role}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl border shadow-sm text-center space-y-4">
        <h2 className="text-xl font-semibold">Dashboard Main</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          This is the central dashboard. Depending on your role, you will be automatically redirected to your primary workspace.
        </p>
        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <button 
            onClick={() => router.push('/dashboard/crm')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            CRM
          </button>
          <button 
            onClick={() => router.push('/dashboard/projects')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Projects
          </button>
          <button 
            onClick={() => router.push('/dashboard/tasks')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Tasks
          </button>
          {user?.role === UserRole.ADMIN && (
            <button 
              onClick={() => router.push('/dashboard/admin/settings')}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Admin Settings
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
