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
import { pmErrorMessage } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PmPeriodTabs({ period, projectId, onChanged }: { period: ProjectPeriod; projectId: string; onChanged?: () => void }) {
  const [editingGoals, setEditingGoals] = useState(false);
  const [goals, setGoals] = useState(period.goals ?? []);
  const [saveGoals, { isLoading: isSavingGoals }] = useSavePeriodGoalsMutation();
  const [uploadReport, { isLoading: isUploadingReport }] = useUploadPeriodReportMutation();
  const reportInputRef = useRef<HTMLInputElement>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [taskView, setTaskView] = useState<"kanban" | "table">("kanban");

  const startGoalsEdit = () => {
    setGoals(period.goals ?? []);
    setEditingGoals(true);
  };

  const cancelGoalsEdit = () => {
    setGoals(period.goals ?? []);
    setEditingGoals(false);
  };

  const handleSaveGoals = async () => {
    try {
      await saveGoals({ periodId: period.id, goals }).unwrap();
      onChanged?.();
      setEditingGoals(false);
    } catch (error) {
      toast.error(pmErrorMessage(error));
    }
  };

  return (
    <Tabs key={period.id} defaultValue="goals" dir="rtl" aria-label="محتوى الفترة المحددة">
      <TabsList aria-label="أقسام الفترة" className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl border bg-muted/60 p-1 shadow-sm sm:grid-cols-7">
        <TabsTrigger value="tasks" className="min-h-11 gap-2"><FolderKanban className="size-[18px]" /> المهام</TabsTrigger>
        <TabsTrigger value="goals" className="min-h-11 gap-2"><Target className="size-[18px]" /> الأهداف</TabsTrigger>
        <TabsTrigger value="files" className="min-h-11 gap-2"><FileText className="size-[18px]" /> الملفات</TabsTrigger>
        <TabsTrigger value="reports" className="min-h-11 gap-2"><FileText className="size-[18px]" /> التقارير</TabsTrigger>
        <TabsTrigger value="campaigns" className="min-h-11 gap-2"><Megaphone className="size-[18px]" /> الحملات</TabsTrigger>
        <TabsTrigger value="meetings" className="min-h-11 gap-2"><Users className="size-[18px]" /> الاجتماعات</TabsTrigger>
        <TabsTrigger value="invoices" className="min-h-11 gap-2"><Receipt className="size-[18px]" /> الفواتير</TabsTrigger>
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
          <Button variant="outline" size="sm" onClick={editingGoals ? cancelGoalsEdit : startGoalsEdit}>
            {editingGoals ? "إلغاء" : <><Plus data-icon="inline-start" /> إضافة هدف</>}
          </Button>
        </div>
        {editingGoals ? (
          <PMGoalEditor goals={goals} onChange={setGoals} onSave={handleSaveGoals} isSaving={isSavingGoals} />
        ) : (
          <GoalList
            goals={period.goals ?? []}
            onEdit={startGoalsEdit}
            onDelete={(index) => {
              setGoals((current) => current.filter((_, goalIndex) => goalIndex !== index));
              setEditingGoals(true);
            }}
          />
        )}
      </TabsContent>

      <TabsContent value="files" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>ملفات الفترة</CardTitle>
            <CardDescription>الملفات المرتبطة بالفترة الحالية.</CardDescription>
          </CardHeader>
          <CardContent>
            {(period.files ?? []).length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                  <EmptyTitle>لا توجد ملفات</EmptyTitle>
                  <EmptyDescription>لم تتم إضافة ملفات لهذه الفترة بعد.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col gap-2">
                {period.files?.map((file) => (
                  <div key={file.id} className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4">
                    <span className="font-medium">{file.fileName}</span>
                    <Badge variant="outline">{file.fileType}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reports" className="mt-6">
        <Card>
          <CardHeader className="flex-col items-start justify-between gap-4 sm:flex-row">
            <div className="flex flex-col gap-1.5">
              <CardTitle>تقرير الفترة</CardTitle>
              <CardDescription>أضف تقرير الفترة أو استبدل التقرير الحالي.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => reportInputRef.current?.click()} disabled={isUploadingReport}><Upload data-icon="inline-start" /> {period.reportFilePath ? "استبدال التقرير" : "رفع التقرير"}</Button>
            <input ref={reportInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" aria-label="رفع تقرير الفترة" onChange={async (event) => { const file = event.target.files?.[0]; if (file) { try { await uploadReport({ periodId: period.id, file }).unwrap(); onChanged?.(); } catch (error) { toast.error(pmErrorMessage(error)); } } event.target.value = ""; }} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4">
              <Badge variant={period.reportFilePath ? "secondary" : "outline"}>{period.reportFilePath ? "مرفوع" : "غير مرفوع"}</Badge>
              <p className="text-sm text-muted-foreground">{period.reportFilePath ? "يوجد تقرير مرفوع لهذه الفترة." : "لم يتم رفع تقرير لهذه الفترة بعد."}</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="campaigns" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>حملات الفترة</CardTitle>
            <CardDescription>الحملات المرتبطة بالفترة الحالية.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4">
              <span className="text-sm text-muted-foreground">الحملات المرتبطة بهذه الفترة</span>
              <Badge variant="secondary">{period.campaignCount ?? 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="meetings" className="mt-6 flex flex-col gap-4">
        <h3 className="text-lg font-semibold">اجتماعات الفترة</h3>
        <PMPeriodMeetings
          periodId={period.id}
          meetings={period.meetings ?? []}
          canEdit
          onChanged={onChanged}
        />
      </TabsContent>

      <TabsContent value="invoices" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>فاتورة الفترة</CardTitle>
            <CardDescription>بيانات الفاتورة المرتبطة بالفترة الحالية.</CardDescription>
          </CardHeader>
          <CardContent>
            {period.invoice ? (
              <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4">
                <span className="text-sm text-muted-foreground">رقم الفاتورة</span>
                <Badge variant="outline">{period.invoice.invoiceNumber}</Badge>
              </div>
            ) : (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Receipt /></EmptyMedia>
                  <EmptyTitle>لا توجد فاتورة</EmptyTitle>
                  <EmptyDescription>لا توجد فاتورة مرتبطة بهذه الفترة.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
