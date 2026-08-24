"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, FolderKanban, Kanban, List, Megaphone, Plus, Receipt, Target, Upload, Users } from "lucide-react";
import type { ProjectPeriod } from "@/features/projects/periodsApi";
import { TaskForm } from "@/components/dashboard/pm/TaskForm";
import { TaskKanban } from "@/components/dashboard/pm/TaskKanban";
import { PMGoalEditor, GoalList } from "@/components/dashboard/pm/PMGoalEditor";
import { PMPeriodMeetings } from "@/components/dashboard/pm/PMPeriodMeetings";
import { useSavePeriodGoalsMutation, useUploadPeriodReportMutation } from "@/features/projects/periodsApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function PmPeriodTabs({ period, projectId, onChanged }: { period: ProjectPeriod; projectId: string; onChanged?: () => void }) {
  const [editingGoals, setEditingGoals] = useState(false);
  const [goals, setGoals] = useState(period.goals ?? []);
  const [saveGoals, { isLoading: isSavingGoals }] = useSavePeriodGoalsMutation();
  const [uploadReport, { isLoading: isUploadingReport }] = useUploadPeriodReportMutation();
  const reportInputRef = useRef<HTMLInputElement>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [taskView, setTaskView] = useState<"kanban" | "table">("kanban");

  const handleSaveGoals = async () => {
    try {
      await saveGoals({ periodId: period.id, goals }).unwrap();
      onChanged?.();
      setEditingGoals(false);
    } catch {
      toast.error("تعذر حفظ أهداف الفترة");
    }
  };

  return (
    <Tabs key={period.id} defaultValue="goals" dir="rtl" aria-label="محتوى الفترة المحددة">
      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-7">
        <TabsTrigger value="tasks" className="gap-2"><FolderKanban className="size-[18px]" /> المهام</TabsTrigger>
        <TabsTrigger value="goals" className="gap-2"><Target className="size-[18px]" /> الأهداف</TabsTrigger>
        <TabsTrigger value="files" className="gap-2"><FileText className="size-[18px]" /> الملفات</TabsTrigger>
        <TabsTrigger value="reports" className="gap-2"><FileText className="size-[18px]" /> التقارير</TabsTrigger>
        <TabsTrigger value="campaigns" className="gap-2"><Megaphone className="size-[18px]" /> الحملات</TabsTrigger>
        <TabsTrigger value="meetings" className="gap-2"><Users className="size-[18px]" /> الاجتماعات</TabsTrigger>
        <TabsTrigger value="invoices" className="gap-2"><Receipt className="size-[18px]" /> الفواتير</TabsTrigger>
      </TabsList>

      <TabsContent value="tasks" className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">مهام الفترة {period.periodNumber}</h3>
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={taskView}
              onValueChange={(value) => value && setTaskView(value as "kanban" | "table")}
              variant="outline"
              size="sm"
              aria-label="طريقة عرض المهام"
            >
              <ToggleGroupItem value="kanban" aria-label="عرض كانبان"><Kanban /></ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="عرض جدول"><List /></ToggleGroupItem>
            </ToggleGroup>
            <Button size="sm" onClick={() => setTaskFormOpen(true)}><Plus data-icon="inline-start" /> مهمة جديدة</Button>
          </div>
        </div>
        <TaskForm projectId={projectId} periodId={period.id} open={taskFormOpen} onOpenChange={setTaskFormOpen} />
        <TaskKanban projectId={projectId} periodId={period.id} view={taskView} />
      </TabsContent>

      <TabsContent value="goals" className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">أهداف الفترة {period.periodNumber}</h3>
          <Button variant="outline" size="sm" onClick={() => setEditingGoals((value) => !value)}>{editingGoals ? "إلغاء" : "تعديل الأهداف"}</Button>
        </div>
        {editingGoals ? <PMGoalEditor goals={goals} onChange={setGoals} onSave={handleSaveGoals} isSaving={isSavingGoals} /> : <GoalList goals={period.goals ?? []} />}
      </TabsContent>

      <TabsContent value="files" className="mt-6 flex flex-col gap-4">
        <h3 className="text-lg font-semibold">ملفات الفترة</h3>
        {(period.files ?? []).length === 0 ? <p className="border-t pt-5 text-sm text-muted-foreground">لا توجد ملفات لهذه الفترة.</p> : (
          <div className="flex flex-col divide-y">
            {period.files?.map((file) => <div key={file.id} className="flex items-center justify-between gap-4 py-4"><span className="font-medium">{file.fileName}</span><span className="text-sm text-muted-foreground">{file.fileType}</span></div>)}
          </div>
        )}
      </TabsContent>

      <TabsContent value="reports" className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">تقرير الفترة</h3>
          <Button variant="outline" size="sm" onClick={() => reportInputRef.current?.click()} disabled={isUploadingReport}><Upload data-icon="inline-start" /> {period.reportFilePath ? "استبدال التقرير" : "رفع التقرير"}</Button>
          <input ref={reportInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" aria-label="رفع تقرير الفترة" onChange={async (event) => { const file = event.target.files?.[0]; if (file) { try { await uploadReport({ periodId: period.id, file }).unwrap(); onChanged?.(); } catch { toast.error("تعذر رفع التقرير"); } } event.target.value = ""; }} />
        </div>
        <p className="border-t pt-5 text-sm text-muted-foreground">{period.reportFilePath ? "يوجد تقرير مرفوع لهذه الفترة." : "لم يتم رفع تقرير لهذه الفترة بعد."}</p>
      </TabsContent>

      <TabsContent value="campaigns" className="mt-6 flex flex-col gap-4">
        <h3 className="text-lg font-semibold">حملات الفترة</h3>
        <p className="border-t pt-5 text-sm text-muted-foreground">{period.campaignCount ?? 0} حملات مرتبطة بهذه الفترة.</p>
      </TabsContent>

      <TabsContent value="meetings" className="mt-6 flex flex-col gap-4">
        <h3 className="text-lg font-semibold">اجتماعات الفترة</h3>
        <PMPeriodMeetings periodId={period.id} meetings={period.meetings ?? []} canEdit />
      </TabsContent>

      <TabsContent value="invoices" className="mt-6 flex flex-col gap-4">
        <h3 className="text-lg font-semibold">فاتورة الفترة</h3>
        <p className="border-t pt-5 text-sm text-muted-foreground">{period.invoice ? `رقم الفاتورة: ${period.invoice.invoiceNumber}` : "لا توجد فاتورة مرتبطة بهذه الفترة."}</p>
      </TabsContent>
    </Tabs>
  );
}
