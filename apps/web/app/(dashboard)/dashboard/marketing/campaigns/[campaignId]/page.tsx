"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Archive, ArchiveRestore, BarChart3, Calendar, CheckCircle2, Copy, DollarSign, Gauge, Megaphone, Pause, Play, RotateCcw, Save, Square, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SurfaceCard as Card } from "@/components/design-system/SurfaceCard";
import { MetricCard } from "@/components/design-system/MetricCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { marketingErrorMessage } from "@/lib/i18n";
import { computeCampaignMetrics, CAMPAIGN_STATUS_BADGE, CAMPAIGN_STATUS_LABELS, PLATFORM_LABELS } from "@/lib/utils/campaign-constants";
import { useArchiveCampaignMutation, useDuplicateCampaignMutation, useFlagOptimizationMutation, useGetCampaignKpiHistoryQuery, useGetCampaignQuery, useUnarchiveCampaignMutation, useUpdateCampaignMetricsMutation, useUpdateCampaignStatusMutation } from "@/features/marketing/marketingApi";
import type { UpdateCampaignMetricsInput } from "@hassad/shared";

type MetricKey = keyof UpdateCampaignMetricsInput;
type FormState = Record<MetricKey, number>;

const INITIAL_FORM: FormState = { budgetSpent: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 };

export default function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [historyPage, setHistoryPage] = useState(1);
  const { data: campaign, isLoading, isError: campaignError } = useGetCampaignQuery(campaignId);
  const { data: history, isLoading: historyLoading, isFetching: historyFetching } = useGetCampaignKpiHistoryQuery({ id: campaignId, page: historyPage, limit: 20 }, { skip: !campaign });
  const [updateMetrics, { isLoading: saving }] = useUpdateCampaignMetricsMutation();
  const [updateStatus, { isLoading: changingStatus }] = useUpdateCampaignStatusMutation();
  const [flagOptimization, { isLoading: flagging }] = useFlagOptimizationMutation();
  const [duplicate, { isLoading: duplicating }] = useDuplicateCampaignMutation();
  const [archive, { isLoading: archiving }] = useArchiveCampaignMutation();
  const [unarchive, { isLoading: unarchiving }] = useUnarchiveCampaignMutation();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (campaign) setForm({ budgetSpent: Number(campaign.budgetSpent ?? 0), revenue: Number(campaign.analytics?.revenue ?? 0), impressions: Number(campaign.analytics?.impressions ?? 0), clicks: Number(campaign.analytics?.clicks ?? 0), conversions: Number(campaign.analytics?.conversions ?? 0) });
  }, [campaign]);

  if (isLoading) return <PageSkeleton />;
  if (!campaign) return <div className="py-20" dir="rtl"><EmptyState icon={Megaphone} title={campaignError ? "تعذر تحميل الحملة" : "الحملة غير موجودة"} description={campaignError ? "تحقق من صلاحياتك أو حاول مرة أخرى." : "تعذر العثور على الحملة المطلوبة."} actionLabel="العودة للحملات" actionHref="/dashboard/marketing/campaigns" /></div>;

  const metrics = computeCampaignMetrics({ ...campaign, analytics: { ...campaign.analytics, impressions: form.impressions, clicks: form.clicks, conversions: form.conversions, revenue: form.revenue } });
  const budgetPercent = campaign.budgetTotal > 0 ? Math.min(100, (metrics.budgetSpent / campaign.budgetTotal) * 100) : 0;
  const backHref = campaign.taskId ? `/dashboard/marketing/tasks/${campaign.taskId}` : "/dashboard/marketing/campaigns";
  const statusAction = async (action: "start" | "pause" | "stop" | "end") => { try { await updateStatus({ id: campaign.id, action }).unwrap(); toast.success("تم تحديث حالة الحملة"); } catch (error) { toast.error(marketingErrorMessage(error)); } };
  const runAction = async (action: () => Promise<unknown>, success: string) => { try { await action(); toast.success(success); } catch (error) { toast.error(marketingErrorMessage(error)); } };
  const saveMetrics = async () => { try { await updateMetrics({ id: campaign.id, body: form }).unwrap(); toast.success("تم حفظ المقاييس وإنشاء لقطة جديدة"); setDialogOpen(false); } catch (error) { toast.error(marketingErrorMessage(error)); } };
  const updateField = (key: MetricKey, value: string) => { const numeric = Number(value); if (Number.isFinite(numeric) && numeric >= 0) setForm((previous) => ({ ...previous, [key]: numeric })); };

  return <main className="page-shell flex flex-col gap-6" dir="rtl">
    <Link href={backHref} className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowRight className="size-4" />العودة للمهمة</Link>
    <PageHeader title={campaign.name} description={`${PLATFORM_LABELS[campaign.platform] ?? campaign.platform} · بدأت في ${formatDate(campaign.startDate)}`} icon={Megaphone} actions={<><StatusBadge status={CAMPAIGN_STATUS_BADGE[campaign.status] ?? "PENDING"} label={CAMPAIGN_STATUS_LABELS[campaign.status] ?? campaign.status} /><Button onClick={() => setDialogOpen(true)}><BarChart3 />تحديث المقاييس</Button></>} />

    <Card title="ملخص الحملة" icon={Calendar}><div className="grid gap-4 sm:grid-cols-3"><Summary label="الميزانية الكلية" value={formatCurrency(campaign.budgetTotal)} /><Summary label="الإنفاق الحالي" value={formatCurrency(metrics.budgetSpent)} /><Summary label="المتبقي" value={formatCurrency(Math.max(0, campaign.budgetTotal - metrics.budgetSpent))} /></div><div className="mt-5 flex flex-col gap-2"><div className="flex justify-between text-sm"><span className="text-muted-foreground">استهلاك الميزانية</span><strong>{budgetPercent.toFixed(1)}%</strong></div><ProgressBar value={budgetPercent} max={100} variant={budgetPercent > 90 ? "danger" : budgetPercent > 70 ? "warning" : "default"} size="md" showLabel /></div></Card>

    <Card title="الإجراءات" icon={Gauge}><div className="flex flex-wrap gap-2">{campaign.status === "PLANNING" && <Button onClick={() => statusAction("start")} disabled={changingStatus}><Play />تفعيل</Button>}{campaign.status === "ACTIVE" && <Button variant="outline" onClick={() => statusAction("pause")} disabled={changingStatus}><Pause />إيقاف مؤقت</Button>}{(campaign.status === "ACTIVE" || campaign.status === "PAUSED") && <><Button variant="outline" onClick={() => statusAction("stop")} disabled={changingStatus}><Square />إنهاء</Button><Button variant="outline" onClick={() => statusAction("end")} disabled={changingStatus}><CheckCircle2 />إكمال</Button></>}<Button variant="outline" onClick={() => runAction(() => duplicate(campaign.id).unwrap(), "تم تكرار الحملة")} disabled={duplicating}><Copy />تكرار</Button><Button variant={campaign.needsOptimization ? "secondary" : "outline"} onClick={() => runAction(() => flagOptimization({ id: campaign.id, needsOptimization: !campaign.needsOptimization }).unwrap(), "تم تحديث علامة التحسين")} disabled={flagging}><AlertTriangle />{campaign.needsOptimization ? "إلغاء علامة التحسين" : "يحتاج تحسين"}</Button>{campaign.isArchived ? <Button variant="outline" onClick={() => runAction(() => unarchive(campaign.id).unwrap(), "تمت استعادة الحملة")} disabled={unarchiving}><ArchiveRestore />استعادة</Button> : <Button variant="outline" onClick={() => runAction(() => archive(campaign.id).unwrap(), "تمت أرشفة الحملة")} disabled={archiving}><Archive />أرشفة</Button>}</div></Card>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><MetricCard title="الربح الصافي" value={formatCurrency(metrics.profit)} icon={DollarSign} variant={metrics.profit > 0 ? "success" : metrics.profit < 0 ? "danger" : "default"} /><MetricCard title="ROAS" value={metrics.roas > 0 ? `${metrics.roas.toFixed(2)}x` : "—"} icon={TrendingUp} /><MetricCard title="التحويلات" value={formatNumber(metrics.conversions)} icon={Target} /><MetricCard title="CTR" value={metrics.ctr > 0 ? `${metrics.ctr.toFixed(2)}%` : "—"} icon={Gauge} /></div>
    {campaign.needsOptimization && <div className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-destructive"><AlertTriangle className="size-5" /><span>تحتاج هذه الحملة إلى مراجعة وتحسين.</span></div>}

    <Card title="سجل لقطات مؤشرات الأداء" description="سجل تاريخي غير قابل للتعديل مرتب من الأحدث إلى الأقدم." icon={BarChart3}><div className="overflow-x-auto">{historyLoading ? <Skeleton className="h-40 w-full" /> : history?.items.length ? <Table aria-label="سجل لقطات مؤشرات الأداء"><TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>الظهور</TableHead><TableHead>النقرات</TableHead><TableHead>التحويلات</TableHead><TableHead>CTR</TableHead><TableHead>ROAS</TableHead><TableHead>المصدر</TableHead></TableRow></TableHeader><TableBody>{history.items.map((snapshot) => <TableRow key={snapshot.id}><TableCell>{formatDate(snapshot.recordedAt)}</TableCell><TableCell>{formatNumber(snapshot.impressions)}</TableCell><TableCell>{formatNumber(snapshot.clicks)}</TableCell><TableCell>{formatNumber(snapshot.conversions)}</TableCell><TableCell>{snapshot.ctr.toFixed(2)}%</TableCell><TableCell>{snapshot.roas.toFixed(2)}x</TableCell><TableCell>{snapshot.source ?? "يدوي"}</TableCell></TableRow>)}</TableBody></Table> : <p className="py-8 text-center text-sm text-muted-foreground">لا توجد لقطات أداء مسجلة.</p>}</div><div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">إجمالي اللقطات: {history?.total ?? 0}</p>{(history?.totalPages ?? 1) > 1 ? <div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={historyPage <= 1 || historyFetching} onClick={() => setHistoryPage((page) => page - 1)}>السابق</Button><span className="text-xs text-muted-foreground">صفحة {historyPage} من {history?.totalPages}</span><Button variant="outline" size="sm" disabled={historyPage >= (history?.totalPages ?? 1) || historyFetching} onClick={() => setHistoryPage((page) => page + 1)}>التالي</Button></div> : null}</div></Card>

    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent dir="rtl"><DialogHeader><DialogTitle>تحديث مقاييس الحملة</DialogTitle><DialogDescription>سيؤدي الحفظ إلى إنشاء لقطة تاريخية جديدة دون تعديل اللقطات السابقة.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2">{METRIC_FIELDS.map((field) => <MetricInput key={field.key} field={field} value={form[field.key]} onChange={(value) => updateField(field.key, value)} />)}</div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}><RotateCcw />إلغاء</Button><Button onClick={saveMetrics} disabled={saving}><Save />{saving ? "جاري الحفظ..." : "حفظ وإنشاء لقطة"}</Button></DialogFooter></DialogContent></Dialog>
  </main>;
}

const METRIC_FIELDS: ReadonlyArray<{ key: MetricKey; label: string }> = [{ key: "budgetSpent", label: "الإنفاق الفعلي" }, { key: "revenue", label: "العائد المحقق" }, { key: "impressions", label: "مرات الظهور" }, { key: "clicks", label: "النقرات" }, { key: "conversions", label: "التحويلات" }];
function Summary({ label, value }: { label: string; value: string }) { return <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-lg font-semibold">{value}</p></div>; }
function MetricInput({ field, value, onChange }: { field: { label: string }; value: number; onChange: (value: string) => void }) { return <div className="flex flex-col gap-2"><label className="text-sm font-medium" htmlFor={`metric-${field.label}`}>{field.label}</label><Input id={`metric-${field.label}`} type="number" min={0} step="any" value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
function PageSkeleton() { return <div className="page-shell flex flex-col gap-6" dir="rtl"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-36 w-full" /><Skeleton className="h-24 w-full" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28" />)}</div><Skeleton className="h-72 w-full" /></div>; }
