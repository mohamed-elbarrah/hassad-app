"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderKanban, Plus, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { CampaignManager } from "./CampaignManager";

// Mock Data for Marketing Tasks
const MOCK_TASKS = [
  {
    id: "task-1",
    title: "إطلاق حملات رمضان الإعلانية",
    clientName: "مطعم ريف العرب",
    projectName: "التسويق الرقمي Q1",
    status: "IN_PROGRESS",
    dueDate: "2024-03-10",
  },
  {
    id: "task-2",
    title: "إعلانات جوجل لخدمات التصميم",
    clientName: "شركة أبعاد",
    projectName: "الهوية البصرية",
    status: "TODO",
    dueDate: "2024-04-05",
  },
];

export function CampaignDashboard() {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const toggleTask = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-600 flex items-center gap-2">
              <FolderKanban className="w-4 h-4" />
              المهام النشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-700">{MOCK_TASKS.length}</div>
            <p className="text-xs text-indigo-600/70 mt-1">مهام تسويقية قيد التنفيذ</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              إجمالي الحملات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">4</div>
            <p className="text-xs text-emerald-600/70 mt-1">حملات نشطة حالياً</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="text-xl font-semibold">مهام التسويق الموكلة إليك</h2>
      </div>

      <div className="space-y-4">
        {MOCK_TASKS.map((task) => {
          const isExpanded = expandedTaskId === task.id;

          return (
            <Card 
              key={task.id} 
              className={`overflow-hidden transition-all duration-300 border-2 ${isExpanded ? 'border-primary/20 shadow-lg' : 'border-transparent hover:border-border'}`}
            >
              <div 
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer bg-card hover:bg-accent/30 transition-colors"
                onClick={() => toggleTask(task.id)}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{task.title}</h3>
                    <Badge variant={task.status === "IN_PROGRESS" ? "default" : "secondary"}>
                      {task.status === "IN_PROGRESS" ? "قيد التنفيذ" : "مجدولة"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      العميل: <span className="font-medium text-foreground">{task.clientName}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      المشروع: <span className="font-medium text-foreground">{task.projectName}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      تاريخ الاستحقاق: <span className="font-medium text-foreground">{task.dueDate}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant={isExpanded ? "default" : "outline"} size="sm" className="gap-2 transition-all">
                    إدارة الحملات
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Expandable Campaign Manager Area */}
              <div 
                className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden bg-accent/10 border-t">
                  <div className="p-6">
                    <CampaignManager taskId={task.id} taskTitle={task.title} />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
