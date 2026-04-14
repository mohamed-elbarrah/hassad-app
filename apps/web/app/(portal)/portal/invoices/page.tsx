'use client'

export default function PortalInvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Invoices</h1>
      </div>
      
      <div className="bg-white p-8 rounded-xl border shadow-sm flex flex-col items-center text-center space-y-4">
        <div className="p-3 bg-green-100 text-green-600 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        </div>
        <h2 className="text-xl font-semibold">Billing Details</h2>
        <p className="text-muted-foreground max-w-md">
          Access your past invoices and manage upcoming payments.
          Integrated with Moyasar for secure processing.
        </p>
      </div>
    </div>
  )
}
