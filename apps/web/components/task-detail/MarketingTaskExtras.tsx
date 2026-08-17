"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Megaphone,
  PauseCircle,
  PlayCircle,
  Plus,
  Send,
  StopCircle,
  Target,
  Upload,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  CampaignPlatform,
  CampaignStatus,
  MarketingStrategyStatus,
  MARKETING_STRATEGY_STATUS_AR,
} from "@hassad/shared";
import type { Campaign } from "@hassad/shared";
import {
  useCreateCampaignMutation,
  useGetCampaignsByTaskQuery,
  useGetTaskStrategyQuery,
  useResubmitStrategyMutation,
  useSendStrategyToClientMutation,
  useUpdateCampaignStatusMutation,
  useUploadStrategyMutation,
} from "@/features/marketing/marketingApi";
import type { TaskTabItem } from "@/components/task-detail/TaskDetailPattern";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  CAMPAIGN_STATUS_LABELS,
  PLATFORM_LABELS,
  computeCampaignMetrics,
} from "@/lib/utils/campaign-constants";

function statusVariant(status?: string | null) {
  switch (status) {
    case MarketingStrategyStatus.APPROVED:
      return "secondary";
    case MarketingStrategyStatus.REJECTED:
    case MarketingStrategyStatus.REVISION_REQUESTED:
      return "destructive";
    default:
      return "outline";
  }
}

function campaignStatusVariant(status?: string | null) {
  switch (status) {
    case CampaignStatus.ACTIVE:
      return "default";
    case CampaignStatus.COMPLETED:
      return "secondary";
    case CampaignStatus.STOPPED:
      return "destructive";
    default:
      return "outline";
  }
}

function openStrategyDownload(strategyId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/v1";
  window.open(`${baseUrl}/marketing-strategies/${strategyId}/download`, "_blank", "noopener,noreferrer");
}

function StrategyTab({
  taskId,
  canManage,
  enabled,
}: {
  taskId: string;
  canManage: boolean;
  enabled: boolean;
}) {
  const {
    data: strategy,
    isLoading,
    refetch,
  } = useGetTaskStrategyQuery(taskId, { skip: !enabled });
  const [uploadStrategy, { isLoading: isUploading }] = useUploadStrategyMutation();
  const [sendStrategy, { isLoading: isSending }] = useSendStrategyToClientMutation();
  const [resubmitStrategy, { isLoading: isResubmitting }] = useResubmitStrategyMutation();
  const uploadRef = useRef<HTMLInputElement>(null);
  const reviseRef = useRef<HTMLInputElement>(null);

  async function handleNewFile(file: File, mode: "create" | "revise") {
    if (file.type !== "application/pdf") {
      toast.error("يجب أن يكون الملف بصيغة PDF");
      return;
    }

    try {
      if (mode === "create") {
        await uploadStrategy({ taskId, file }).unwrap();
        toast.success("تم رفع الدراسة التسويقية");
      } else if (strategy) {
        await resubmitStrategy({ id: strategy.id, file }).unwrap();
        toast.success("تم رفع النسخة المعدلة");
      }
      void refetch();
    } catch {
      toast.error("فشل حفظ الدراسة التسويقية");
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  }

  if (!strategy) {
    return (
      <Card>
        <CardContent className="p-8">
          <Empty>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>لا توجد دراسة تسويقية</EmptyTitle>
              <EmptyDescription>
                ارفع الدراسة التسويقية أولًا قبل متابعة إنشاء الحملات.
              </EmptyDescription>
            </EmptyHeader>
            {canManage ? (
              <EmptyContent>
                <input
                  ref={uploadRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleNewFile(file, "create");
                    if (uploadRef.current) uploadRef.current.value = "";
                  }}
                />
                <Button onClick={() => uploadRef.current?.click()} disabled={isUploading}>
                  <Upload data-icon="inline-start" />
                  {isUploading ? "جارٍ الرفع..." : "رفع الدراسة"}
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        </CardContent>
      </Card>
    );
  }

  const status = strategy.status as MarketingStrategyStatus;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-muted-foreground" />
              الدراسة التسويقية
            </CardTitle>
            <CardDescription>
              النسخة المعتمدة أو الجارية للمراجعة قبل إطلاق الحملات.
            </CardDescription>
          </div>
          <Badge variant={statusVariant(status)}>
            {MARKETING_STRATEGY_STATUS_AR[status] || status}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg border p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{strategy.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {(strategy.fileSize / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openStrategyDownload(strategy.id)}>
                  <Download data-icon="inline-start" />
                  تحميل
                </Button>
                {canManage && status === MarketingStrategyStatus.DRAFT ? (
                  <Button size="sm" onClick={async () => {
                    try {
                      await sendStrategy(strategy.id).unwrap();
                      toast.success("تم إرسال الدراسة للعميل");
                      void refetch();
                    } catch {
                      toast.error("فشل إرسال الدراسة");
                    }
                  }} disabled={isSending}>
                    <Send data-icon="inline-start" />
                    {isSending ? "جارٍ الإرسال..." : "إرسال للعميل"}
                  </Button>
                ) : null}
                {canManage && status === MarketingStrategyStatus.REVISION_REQUESTED ? (
                  <>
                    <input
                      ref={reviseRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleNewFile(file, "revise");
                        if (reviseRef.current) reviseRef.current.value = "";
                      }}
                    />
                    <Button size="sm" onClick={() => reviseRef.current?.click()} disabled={isResubmitting}>
                      <Upload data-icon="inline-start" />
                      {isResubmitting ? "جارٍ الرفع..." : "رفع نسخة معدلة"}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {strategy.revisionNote ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4">
                <p className="text-sm font-medium">ملاحظات التعديل</p>
                <p className="mt-2 text-sm text-muted-foreground">{strategy.revisionNote}</p>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <MiniMetric title="الحالة" value={MARKETING_STRATEGY_STATUS_AR[status] || status} />
            <MiniMetric title="أُنشئت" value={new Date(strategy.createdAt).toLocaleDateString("ar-SA")} />
            <MiniMetric
              title="أُرسلت"
              value={strategy.sentAt ? new Date(strategy.sentAt).toLocaleDateString("ar-SA") : "—"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function CampaignCreateDialog({
  open,
  onOpenChange,
  taskId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
}) {
  const [createCampaign, { isLoading }] = useCreateCampaignMutation();
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<CampaignPlatform>(CampaignPlatform.GOOGLE);
  const [budgetTotal, setBudgetTotal] = useState("1000");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createCampaign({
        taskId,
        name,
        platform,
        budgetTotal: Number(budgetTotal),
        startDate,
      }).unwrap();
      toast.success("تم إنشاء الحملة");
      setName("");
      onOpenChange(false);
    } catch {
      toast.error("فشل إنشاء الحملة");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة حملة جديدة</DialogTitle>
          <DialogDescription>
            أضف حملة مرتبطة بهذه المهمة التسويقية.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="campaign-name">اسم الحملة</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثال: Google Search - Ramdan"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>المنصة</Label>
            <Select value={platform} onValueChange={(value) => setPlatform(value as CampaignPlatform)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CampaignPlatform).map((item) => (
                  <SelectItem key={item} value={item}>
                    {PLATFORM_LABELS[item] || item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="campaign-budget">الميزانية</Label>
              <Input
                id="campaign-budget"
                type="number"
                min="0"
                value={budgetTotal}
                onChange={(event) => setBudgetTotal(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="campaign-date">تاريخ البدء</Label>
              <Input
                id="campaign-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "جارٍ الحفظ..." : "إنشاء الحملة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CampaignsTab({
  taskId,
  canManage,
  enabled,
}: {
  taskId: string;
  canManage: boolean;
  enabled: boolean;
}) {
  const { data: campaigns = [], isLoading } = useGetCampaignsByTaskQuery(taskId, {
    skip: !enabled,
  });
  const { data: strategy } = useGetTaskStrategyQuery(taskId, { skip: !enabled });
  const [updateStatus] = useUpdateCampaignStatusMutation();
  const [isOpen, setIsOpen] = useState(false);
  const strategyApproved = strategy?.status === MarketingStrategyStatus.APPROVED;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {!strategyApproved ? (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
            <p className="text-sm text-amber-900">
              يجب الموافقة على الدراسة التسويقية قبل إنشاء الحملات أو تشغيلها.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-medium">الحملات الإعلانية</h3>
          <p className="text-sm text-muted-foreground">
            متابعة الحملات المرتبطة بهذه المهمة.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setIsOpen(true)} disabled={!strategyApproved}>
            <Plus data-icon="inline-start" />
            إضافة حملة
          </Button>
        ) : null}
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Megaphone />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>لا توجد حملات</EmptyTitle>
                <EmptyDescription>لم يتم إنشاء أي حملة مرتبطة بهذه المهمة بعد.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => {
            const metrics = computeCampaignMetrics(campaign as any);
            const budgetPct =
              campaign.budgetTotal > 0
                ? Math.round((campaign.budgetSpent / campaign.budgetTotal) * 100)
                : 0;
            const canStart = campaign.status === CampaignStatus.PLANNING;
            const canPause = campaign.status === CampaignStatus.ACTIVE;
            const canStop =
              campaign.status === CampaignStatus.ACTIVE ||
              campaign.status === CampaignStatus.PAUSED;
            const canComplete =
              campaign.status === CampaignStatus.ACTIVE ||
              campaign.status === CampaignStatus.PAUSED;

            return (
              <Card key={campaign.id}>
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{campaign.name}</CardTitle>
                      <CardDescription>
                        {PLATFORM_LABELS[campaign.platform] || campaign.platform}
                      </CardDescription>
                    </div>
                    <Badge variant={campaignStatusVariant(campaign.status)}>
                      {CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <MiniMetric title="الميزانية" value={formatCurrency(campaign.budgetTotal)} />
                    <MiniMetric title="الإنفاق" value={formatCurrency(campaign.budgetSpent)} />
                    <MiniMetric title="العائد" value={formatCurrency(metrics.revenue)} />
                    <MiniMetric
                      title="ROAS"
                      value={metrics.roas > 0 ? `${metrics.roas.toFixed(2)}x` : "—"}
                    />
                  </div>
                  <div className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">استهلاك الميزانية</span>
                      <span className="font-medium">{budgetPct}%</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/marketing/campaigns/${campaign.id}`}>
                        <Eye data-icon="inline-start" />
                        إدارة
                      </Link>
                    </Button>
                    {canManage && canStart ? (
                      <Button size="sm" onClick={() => updateStatus({ id: campaign.id, action: "start" })}>
                        <PlayCircle data-icon="inline-start" />
                        تشغيل
                      </Button>
                    ) : null}
                    {canManage && canPause ? (
                      <Button variant="outline" size="sm" onClick={() => updateStatus({ id: campaign.id, action: "pause" })}>
                        <PauseCircle data-icon="inline-start" />
                        إيقاف
                      </Button>
                    ) : null}
                    {canManage && canStop ? (
                      <Button variant="outline" size="sm" onClick={() => updateStatus({ id: campaign.id, action: "stop" })}>
                        <StopCircle data-icon="inline-start" />
                        إنهاء
                      </Button>
                    ) : null}
                    {canManage && canComplete ? (
                      <Button size="sm" onClick={() => updateStatus({ id: campaign.id, action: "end" })}>
                        <CheckCircle2 data-icon="inline-start" />
                        إكمال
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {canManage ? (
        <CampaignCreateDialog open={isOpen} onOpenChange={setIsOpen} taskId={taskId} />
      ) : null}
    </div>
  );
}

function PerformanceTab({
  taskId,
  enabled,
}: {
  taskId: string;
  enabled: boolean;
}) {
  const { data: campaigns = [], isLoading } = useGetCampaignsByTaskQuery(taskId, {
    skip: !enabled,
  });

  const aggregated = useMemo(() => {
    return campaigns.reduce(
      (acc, campaign: Campaign & Record<string, any>) => {
        const metrics = computeCampaignMetrics(campaign);
        acc.budgetTotal += campaign.budgetTotal ?? 0;
        acc.spend += campaign.budgetSpent ?? 0;
        acc.revenue += metrics.revenue;
        acc.clicks += metrics.clicks;
        acc.impressions += metrics.impressions;
        acc.conversions += metrics.conversions;
        return acc;
      },
      { budgetTotal: 0, spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0 },
    );
  }, [campaigns]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <Empty>
            <EmptyMedia variant="icon">
              <BarChart3 />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>لا توجد بيانات أداء</EmptyTitle>
              <EmptyDescription>ستظهر مؤشرات الأداء هنا بعد إنشاء الحملات.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  const roas = aggregated.spend > 0 ? aggregated.revenue / aggregated.spend : 0;
  const ctr = aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions) * 100 : 0;
  const cpc = aggregated.clicks > 0 ? aggregated.spend / aggregated.clicks : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-start justify-between gap-4 p-5">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">إجمالي الميزانية</span>
              <span className="text-lg font-semibold">{formatCurrency(aggregated.budgetTotal)}</span>
            </div>
            <Wallet className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between gap-4 p-5">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">إجمالي الإنفاق</span>
              <span className="text-lg font-semibold">{formatCurrency(aggregated.spend)}</span>
            </div>
            <Wallet className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between gap-4 p-5">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">إجمالي التحويلات</span>
              <span className="text-lg font-semibold">{formatNumber(aggregated.conversions)}</span>
            </div>
            <Target className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between gap-4 p-5">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">متوسط ROAS</span>
              <span className="text-lg font-semibold">{roas > 0 ? `${roas.toFixed(2)}x` : "—"}</span>
            </div>
            <BarChart3 className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ملخص الأداء</CardTitle>
          <CardDescription>مؤشرات مجمعة لجميع الحملات المرتبطة بالمهمة.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <MiniMetric title="CTR" value={ctr > 0 ? `${ctr.toFixed(2)}%` : "—"} />
          <MiniMetric title="CPC" value={cpc > 0 ? formatCurrency(cpc) : "—"} />
          <MiniMetric title="الزيارات / الظهورات" value={`${formatNumber(aggregated.clicks)} / ${formatNumber(aggregated.impressions)}`} />
        </CardContent>
      </Card>
    </div>
  );
}

export function useMarketingTaskExtraTabs({
  taskId,
  canManage,
  enabled,
}: {
  taskId: string;
  canManage: boolean;
  enabled: boolean;
}) {
  const { data: campaigns = [] } = useGetCampaignsByTaskQuery(taskId, {
    skip: !enabled,
  });

  return [
    {
      value: "marketing-strategy",
      label: "الدراسة التسويقية",
      icon: FileText,
      content: <StrategyTab taskId={taskId} canManage={canManage} enabled={enabled} />,
    },
    {
      value: "marketing-campaigns",
      label: "الحملات",
      icon: Megaphone,
      badge: String(campaigns.length),
      content: <CampaignsTab taskId={taskId} canManage={canManage} enabled={enabled} />,
    },
    {
      value: "marketing-performance",
      label: "الأداء",
      icon: BarChart3,
      content: <PerformanceTab taskId={taskId} enabled={enabled} />,
    },
  ] satisfies TaskTabItem[];
}
