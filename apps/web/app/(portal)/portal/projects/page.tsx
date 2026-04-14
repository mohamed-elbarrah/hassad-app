'use client'

export default function PortalProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">My Projects</h1>
      </div>
      
      <div className="bg-white p-8 rounded-xl border shadow-sm flex flex-col items-center text-center space-y-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        </div>
        <h2 className="text-xl font-semibold">Project List</h2>
        <p className="text-muted-foreground max-w-md">
          A list of all projects being managed for your agency.
          You can track milestones, view reports, and provide feedback here.
        </p>
      </div>
    </div>
  )
}
