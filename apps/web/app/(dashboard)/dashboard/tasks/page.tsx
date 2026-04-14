'use client'

import { useAppSelector } from '@/lib/hooks'

export default function TasksPage() {
  const { user } = useAppSelector((state) => state.auth)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Tasks</h1>
      </div>
      
      <div className="bg-white p-8 rounded-xl border shadow-sm flex flex-col items-center text-center space-y-4">
        <div className="p-3 bg-green-100 text-green-600 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </div>
        <h2 className="text-xl font-semibold">Tasks Workspace</h2>
        <p className="text-muted-foreground max-w-md">
          Personal tasks and assignments for {user?.name}.
          This page is accessible to all internal staff.
        </p>
      </div>
    </div>
  )
}
