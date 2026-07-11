"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Download,
  Edit,
  ExternalLink,
  FileText,
  ChartLine,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import { Dialog } from "@/components/design-system/Dialog";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { EmptyState } from "@/components/design-system/EmptyState";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { DataTable } from "@/components/design-system/DataTable";
import {
  useGetAdminCampaignQuery,
  useUpdateAdminCampaignMutation,
} from "@/features/admin/adminApi";
import { CAMPAIGN_STATUS_AR, CAMPAIGN_PLATFORM_AR } from "@hassad/shared";
import { toast } from "sonner";

function KpiLineChart({ data }: { data: any[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const chartData = useMemo(() => {
    const sorted = [...data].sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    );
    return {
      labels: sorted.map((d) => {
        const date = new Date(d.recordedAt);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      impressions: sorted.map((d) => d.impressions ?? 0),
      clicks: sorted.map((d) => d.clicks ?? 0),
      conversions: sorted.map((d) => d.conversions ?? 0),
    };
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartData.labels.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(
      ...chartData.impressions,
      ...chartData.clicks,
      ...chartData.conversions,
      1,
    );
    const xStep = chartData.labels.length > 1 ? chartW / (chartData.labels.length - 1) : chartW / 2;

    const drawLine = (values: number[], color: string) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      values.forEach((v, i) => {
        const x = pad.left + i * xStep;
        const y = pad.top + chartH - (v / maxVal) * chartH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    drawLine(chartData.impressions, "#6366f1");
    drawLine(chartData.clicks, "#22c55e");
    drawLine(chartData.conversions, "#f59e0b");

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    chartData.labels.forEach((label, i) => {
      const x = pad.left + i * xStep;
      ctx.fillText(label, x, h - pad.bottom + 20);
    });
  }, [chartData]);

  if (data.length === 0) return null;

  return (
    <div className="relative w-full h-64">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      <div className="flex gap-4 justify-center mt-2 text-xs">
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-full bg-indigo-500" />
          مرات الظهور
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-full bg-green-500" />
          النقرات
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-full bg-amber-500" />
          التحويلات
        </span>
      </div>
    </div>
  );
}

function exportCampaignCSV(campaign: any) {
  const BOM = "\uFEFF";
  const rows = [
    ["الحقل", "القيمة"],
    ["الاسم", campaign.name],
    ["العميل", campaign.client?.companyName ?? ""],
    ["المسؤول", campaign.manager?.name ?? ""],
    ["المنصة", CAMPAIGN_PLATFORM_AR[campaign.platform] ?? campaign.platform],
    ["الحالة", CAMPAIGN_STATUS_AR[campaign.status] ?? campaign.status],
    ["الميزانية", String(campaign.budgetTotal ?? 0)],
    ["المصروف", String(campaign.budgetSpent ?? 0)],
    ["تاريخ البداية", campaign.startDate?.slice(0, 10) ?? ""],
    ["تاريخ النهاية", campaign.endDate?.slice(0, 10) ?? ""],
  ];
  for (const snap of campaign.kpiSnapshots ?? []) {
    rows.push([
      `KPI - ${snap.recordedAt?.slice(0, 10) ?? ""}`,
      `مرات الظهور: ${snap.impressions}, نقرات: ${snap.clicks}, تحويلات: ${snap.conversions}, إيرادات: ${snap.revenue}`,
    ]);
  }
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `campaign-${campaign.name}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: campaign, isLoading } = useGetAdminCampaignQuery(id);
  const [updateCampaign, { isLoading: isUpdating }] = useUpdateAdminCampaignMutation();

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    platform: "",
    budgetTotal: 0,
    startDate: "",
    endDate: "",
  });

  const kpiSnapshots = campaign?.kpiSnapshots ?? [];

  const handleEditSave = async () => {
    if (!campaign) return;
    try {
      await updateCampaign({
        id: campaign.id,
        data: {
          name: editForm.name,
          platform: editForm.platform || undefined,
          budgetTotal: editForm.budgetTotal,
          startDate: editForm.startDate,
          endDate: editForm.endDate || undefined,
        },
      }).unwrap();
      toast.success("تم تحديث الحملة بنجاح");
      setShowEdit(false);
    } catch {
      toast.error("فشل تحديث الحملة");
    }
  };

  const openEdit = () => {
    if (!campaign) return;
    setEditForm({
      name: campaign.name,
      platform: campaign.platform,
      budgetTotal: campaign.budgetTotal,
      startDate: campaign.startDate?.slice(0, 10) ?? "",
      endDate: campaign.endDate?.slice(0, 10) ?? "",
    });
    setShowEdit(true);
  };

  if (isLoading)
    return (
      <div className="flex flex-col gap-6 p-6" dir="rtl">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  if (!campaign)
    return (
      <div className="p-6 text-center text-portal-note-text" dir="rtl">
        الحملة غير موجودة
      </div>
    );

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title={campaign.name}
        description={`${campaign.client?.companyName ?? "—"} · ${CAMPAIGN_STATUS_AR[campaign.status] ?? campaign.status}`}
        icon={BarChart3}
        actions={
          <div className="flex gap-2">
            <ActionButton variant="outline" size="md" onClick={openEdit}>
              <Edit className="size-4 ml-1" />
              تعديل الحملة
            </ActionButton>
            <ActionButton
              variant="outline"
              size="md"
              onClick={() => exportCampaignCSV(campaign)}
            >
              <Download className="size-4 ml-1" />
              تصدير تقرير
            </ActionButton>
            <ActionButton
              variant="outline"
              size="md"
              onClick={() => router.back()}
            >
              <ArrowRight className="size-4 ml-1" />
              العودة
            </ActionButton>
          </div>
        }
      />

      <SurfaceCard>
        <Tabs defaultValue="overview" dir="rtl">
          <TabsList className="w-full justify-start gap-1 px-4 pt-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="kpis">مؤشرات الأداء</TabsTrigger>
            <TabsTrigger value="chart">رسم بياني</TabsTrigger>
            <TabsTrigger value="tasks">المهام المرتبطة</TabsTrigger>
            <TabsTrigger value="strategy">الاستراتيجية التسويقية</TabsTrigger>
            <TabsTrigger value="history">سجل الحالة</TabsTrigger>
            <TabsTrigger value="connections">اتصالات المنصات</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">العميل</span>
                    <p className="text-base font-medium">
                      {campaign.client?.companyName ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">المسؤول</span>
                    <p className="text-base font-medium">
                      {campaign.manager?.name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">المنصة</span>
                    <p className="text-base font-medium">
                      {CAMPAIGN_PLATFORM_AR[campaign.platform] ?? campaign.platform ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">الحالة</span>
                    <div className="mt-1">
                      <StatusBadge
                        status={campaign.status}
                        label={CAMPAIGN_STATUS_AR[campaign.status] ?? campaign.status}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">الميزانية</span>
                    <p className="text-base font-medium">
                      {campaign.budgetTotal?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">المصروف</span>
                    <p className="text-base font-medium">
                      {campaign.budgetSpent?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">تجاوز الميزانية</span>
                    <p className="text-base font-medium">
                      {Number(campaign.budgetSpent) > Number(campaign.budgetTotal) ? (
                        <Pill tone="danger">تجاوز</Pill>
                      ) : (
                        "لا"
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">تاريخ البداية - النهاية</span>
                    <p className="text-base font-medium">
                      {campaign.startDate?.slice(0, 10) ?? "—"} →{" "}
                      {campaign.endDate?.slice(0, 10) ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="kpis">
              <DataTable
                columns={[
                  { id: "date", label: "التاريخ", align: "left" },
                  { id: "impressions", label: "مرات الظهور" },
                  { id: "clicks", label: "نقرات" },
                  { id: "conversions", label: "تحويلات" },
                  { id: "revenue", label: "إيرادات" },
                  { id: "ctr", label: "CTR" },
                  { id: "cpa", label: "CPA" },
                ]}
                data={kpiSnapshots}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: BarChart3,
                  message: "لا توجد مؤشرات أداء",
                  hint: "لم يتم تسجيل مؤشرات أداء لهذه الحملة بعد",
                }}
                renderRow={(k: any) => (
                  <tr key={k.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {k.recordedAt?.slice(0, 10) ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm">{k.impressions ?? 0}</td>
                    <td className="px-5 py-3 text-sm">{k.clicks ?? 0}</td>
                    <td className="px-5 py-3 text-sm">{k.conversions ?? 0}</td>
                    <td className="px-5 py-3 text-sm">{k.revenue ?? 0}</td>
                    <td className="px-5 py-3 text-sm">{k.ctr ? `${k.ctr}%` : "—"}</td>
                    <td className="px-5 py-3 text-sm">{k.cpa ?? "—"}</td>
                  </tr>
                )}
              />
            </TabsContent>

            <TabsContent value="chart">
              <SurfaceCard title="مؤشرات الأداء عبر الزمن" icon={ChartLine}>
                {kpiSnapshots.length > 0 ? (
                  <KpiLineChart data={kpiSnapshots} />
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="لا توجد بيانات كافية"
                    hint="بيانات مؤشرات الأداء غير كافية لرسم بياني"
                  />
                )}
              </SurfaceCard>
            </TabsContent>

            <TabsContent value="tasks">
              {campaign.task ? (
                <SurfaceCard>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold text-natural-100">
                          {campaign.task.title}
                        </p>
                        <p className="text-sm text-portal-note-text mt-1">
                          {campaign.task.assignee?.name ?? "—"}
                        </p>
                      </div>
                      <Pill
                        tone={
                          campaign.task.status === "DONE"
                            ? "success"
                            : campaign.task.status === "IN_PROGRESS"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {campaign.task.status}
                      </Pill>
                    </div>
                  </div>
                </SurfaceCard>
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="لا توجد مهام مرتبطة"
                  hint="هذه الحملة غير مرتبطة بأي مهمة"
                />
              )}
            </TabsContent>

            <TabsContent value="strategy">
              {campaign.task?.marketingStrategies?.length > 0 ? (
                <div className="space-y-3">
                  {campaign.task.marketingStrategies.map((s: any) => (
                    <SurfaceCard key={s.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="size-5 text-portal-icon" />
                          <div>
                            <p className="text-sm font-medium text-natural-100">
                              {s.fileName}
                            </p>
                            <p className="text-xs text-portal-note-text">
                              {s.createdAt?.slice(0, 10) ?? "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Pill
                            tone={
                              s.status === "APPROVED"
                                ? "success"
                                : s.status === "DRAFT"
                                  ? "neutral"
                                  : "warning"
                            }
                          >
                            {s.status}
                          </Pill>
                          {s.filePath && (
                            <ActionButton
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(s.filePath, "_blank")}
                            >
                              <ExternalLink className="size-4" />
                            </ActionButton>
                          )}
                        </div>
                      </div>
                    </SurfaceCard>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="لا توجد استراتيجية تسويقية"
                  hint="لم يتم ربط استراتيجية تسويقية بهذه الحملة"
                />
              )}
            </TabsContent>

            <TabsContent value="history">
              <DataTable
                columns={[
                  { id: "from", label: "من" },
                  { id: "to", label: "إلى" },
                  { id: "by", label: "بواسطة" },
                  { id: "date", label: "التاريخ", align: "left" },
                ]}
                data={campaign.statusHistory ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: BarChart3,
                  message: "لا يوجد سجل",
                  hint: "لم يتم تسجيل تغييرات في الحالة",
                }}
                renderRow={(h: any) => (
                  <tr key={h.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm">
                      <StatusBadge status={h.fromStatus} label={h.fromStatus} />
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <StatusBadge status={h.toStatus} label={h.toStatus} />
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text">
                      {h.changedBy ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {h.createdAt?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>

            <TabsContent value="connections">
              <DataTable
                columns={[
                  { id: "platform", label: "المنصة" },
                  { id: "status", label: "الحالة" },
                  { id: "lastSync", label: "آخر مزامنة", align: "left" },
                ]}
                data={campaign.platformConnections ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: BarChart3,
                  message: "لا توجد اتصالات",
                  hint: "لم يتم ربط هذه الحملة بأي منصة إعلانية",
                }}
                renderRow={(c: any) => (
                  <tr key={c.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">{c.platform}</td>
                    <td className="px-5 py-3 text-sm">
                      <Pill tone={c.syncStatus === "SYNCED" ? "success" : "warning"}>
                        {c.syncStatus}
                      </Pill>
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {c.lastSyncedAt?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>
          </div>
        </Tabs>
      </SurfaceCard>

      <Dialog
        open={showEdit}
        onOpenChange={setShowEdit}
        title="تعديل الحملة"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <ActionButton variant="outline" onClick={() => setShowEdit(false)}>
              إلغاء
            </ActionButton>
            <ActionButton
              onClick={handleEditSave}
              loading={isUpdating}
              disabled={!editForm.name || !editForm.startDate}
            >
              حفظ التعديلات
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-natural-100">اسم الحملة *</label>
            <FormInputControl
              placeholder="اسم الحملة"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-natural-100">المنصة</label>
            <select
              value={editForm.platform}
              onChange={(e) => setEditForm((f) => ({ ...f, platform: e.target.value }))}
              className="w-full rounded-xl border border-portal-divider bg-natural-0 px-4 py-2.5 text-sm text-natural-100 focus:outline-none focus:ring-2 focus:ring-secondary-500"
            >
              <option value="">اختر المنصة</option>
              {Object.entries(CAMPAIGN_PLATFORM_AR).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-natural-100">الميزانية</label>
            <FormInputControl
              type="number"
              min={0}
              placeholder="الميزانية"
              value={editForm.budgetTotal || ""}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, budgetTotal: parseFloat(e.target.value) || 0 }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-natural-100">تاريخ البداية *</label>
              <FormInputControl
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-natural-100">تاريخ النهاية</label>
              <FormInputControl
                type="date"
                value={editForm.endDate}
                onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
