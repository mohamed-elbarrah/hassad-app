'use client'

import { useAppSelector } from '@/lib/hooks'
import { useRouter } from 'next/navigation'

export default function PortalPage() {
  const { user } = useAppSelector((state) => state.auth)
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Welcome, {user?.name}</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div 
          onClick={() => router.push('/portal/projects')}
          className="p-8 bg-white rounded-xl border-2 border-primary/5 shadow-sm hover:border-primary/20 transition-all cursor-pointer group"
        >
          <div className="p-3 bg-primary/5 text-primary rounded-lg w-fit group-hover:bg-primary/10 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h3 className="text-xl font-bold mt-4">My Projects</h3>
          <p className="text-muted-foreground mt-2">View the status and progress of your active marketing campaigns.</p>
        </div>

        <div 
          onClick={() => router.push('/portal/invoices')}
          className="p-8 bg-white rounded-xl border-2 border-primary/5 shadow-sm hover:border-primary/20 transition-all cursor-pointer group"
        >
          <div className="p-3 bg-primary/5 text-primary rounded-lg w-fit group-hover:bg-primary/10 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </div>
          <h3 className="text-xl font-bold mt-4">Invoices & Payments</h3>
          <p className="text-muted-foreground mt-2">Manage your billing, download invoices, and process payments.</p>
        </div>
      </div>
    </div>
  )
}
