"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  ArrowUpRight, 
  Target, 
  AlertCircle,
  LayoutGrid,
  List,
  ChevronDown
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useGetMyTasksQuery } from "@/features/tasks/tasksApi";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingTasksListPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const { data: tasks = [], isLoading } = useGetMyTasksQuery({});

  // Filter tasks to only show Marketing ones
  const marketingTasks = tasks.filter(task => 
    task.department?.name === "MARKETING"
  );

  return (
    <div className="flex flex-col gap-6 pb-10" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المهام التسويقية المسندة</h1>
          <p className="text-muted-foreground mt-2">
            جميع المهام التي تم إسنادها إليك من قبل مديري المشاريع.
          </p>
        </div>
        <div className="flex items-center gap-2 border rounded-lg p-1 bg-muted/50">
          <Button 
            variant={view === "grid" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setView("grid")}
            className="h-8 w-8 p-0"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button 
            variant={view === "list" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setView("list")}
            className="h-8 w-8 p-0"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketingTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}


function TaskCard({ task }: { task: any }) {
  const [status, setStatus] = useState(task.status);

  const statusOptions = [
    { label: "قيد الانتظار", value: "TODO" },
    { label: "قيد التنفيذ", value: "IN_PROGRESS" },
    { label: "قيد المراجعة", value: "IN_REVIEW" },
    { label: "مكتمل", value: "DONE" },
  ];

  return (
    <Card className="group overflow-hidden shadow-sm border-muted/60 hover:border-primary/40 transition-all flex flex-col">
      <CardHeader className="pb-3 border-b border-muted/40 bg-muted/5">
        <div className="flex justify-between items-start gap-2 mb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={`h-6 px-2 text-[10px] font-bold gap-1 ${getStatusColor(status)}`}>
                {status}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="text-right">
              {statusOptions.map((opt) => (
                <DropdownMenuItem 
                  key={opt.value} 
                  onClick={() => setStatus(opt.value)}
                  className="text-xs"
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <CardTitle className="text-lg group-hover:text-primary transition-colors leading-snug">
          {task.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4 flex-1 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">العميل</span>
            <span className="font-bold">{task.project?.client?.companyName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">المشروع</span>
            <span className="font-medium text-slate-600">{task.project?.name}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-muted/40">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground font-medium">الموعد</span>
              <span className="text-sm font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(task.dueDate).toLocaleDateString('ar-EG')}
              </span>
            </div>
          </div>
          <Link href={`/dashboard/marketing/tasks/${task.id}`}>
            <Button size="sm" className="gap-2">
              التنفيذ
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}


function getStatusColor(status: string) {
  switch (status) {
    case "TODO": return "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100";
    case "IN_PROGRESS": return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100";
    case "IN_REVIEW": return "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100";
    case "DONE": return "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
    default: return "bg-slate-100 text-slate-600";
  }
}

