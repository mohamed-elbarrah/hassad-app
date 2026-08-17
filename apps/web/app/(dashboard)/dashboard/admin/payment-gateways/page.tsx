"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  BadgeCheck,
  Building2,
  CreditCard,
  Landmark,
  Loader2,
  Plus,
  RefreshCw,
  Settings2,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import {
  useCheckAdminGatewaysHealthMutation,
  useCreateAdminBankAccountMutation,
  useDeleteAdminBankAccountMutation,
  useGetAdminBankAccountsQuery,
  useGetAdminGatewaysHealthQuery,
  useGetAdminGatewaysQuery,
  useUpdateAdminBankAccountMutation,
  useUpdateAdminGatewayMutation,
} from "@/features/admin/adminFinanceApi";
import { formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Gateway = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  configJson: { fields: Record<string, boolean>; isConfigured: boolean } | null;
  createdAt: string;
  updatedAt: string;
};

type GatewayHealth = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  status: string;
  lastCheckedAt: string | null;
  error: string | null;
};

type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string | null;
  iban: string;
  swiftCode: string | null;
  instructions: string | null;
  isActive: boolean;
  createdAt: string;
};

type StripeFormState = {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  isActive: boolean;
};

type BankFormState = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
  instructions: string;
  isActive: boolean;
};

const EMPTY_BANK_FORM: BankFormState = {
  bankName: "",
  accountName: "",
  accountNumber: "",
  iban: "",
  swiftCode: "",
  instructions: "",
  isActive: true,
};

const GATEWAY_LABELS: Record<string, string> = {
  stripe: "Stripe",
  bank_transfer: "التحويل البنكي",
};

const GATEWAY_HELP: Record<string, string> = {
  stripe: "للدفع الفوري بالبطاقات داخل الفواتير والعقود.",
  bank_transfer: "للسداد اليدوي عبر الحسابات البنكية المعتمدة.",
};

const HEALTH_LABELS: Record<string, string> = {
  HEALTHY: "سليم",
  DEGRADED: "بحاجة متابعة",
  DOWN: "متوقف",
  UNKNOWN: "غير معروف",
};

const HEALTH_BADGE_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  HEALTHY: "default",
  DEGRADED: "secondary",
  DOWN: "destructive",
  UNKNOWN: "outline",
};

function getGatewayIcon(name: string) {
  if (name === "stripe") return CreditCard;
  return Landmark;
}

function getGatewayLabel(name: string) {
  return GATEWAY_LABELS[name] ?? name;
}

function getHealthLabel(status?: string | null) {
  if (!status) return "غير معروف";
  return HEALTH_LABELS[status] ?? status;
}

function getHealthVariant(status?: string | null) {
  if (!status) return "outline";
  return HEALTH_BADGE_VARIANTS[status] ?? "outline";
}

function safeErrorMessage(error: unknown, fallback: string) {
  const apiMessage = (error as { data?: { message?: string } })?.data?.message;
  return apiMessage || fallback;
}

function compactMask(value?: string | null) {
  if (!value) return "—";
  if (value.length <= 6) return value;
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

function BankAccountDialog({
  open,
  title,
  description,
  form,
  isSaving,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  form: BankFormState;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (patch: Partial<BankFormState>) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl">
        <DialogHeader className="text-right">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="bankName">اسم البنك</Label>
            <Input
              id="bankName"
              value={form.bankName}
              onChange={(event) => onChange({ bankName: event.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="accountName">اسم صاحب الحساب</Label>
            <Input
              id="accountName"
              value={form.accountName}
              onChange={(event) => onChange({ accountName: event.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={form.iban}
              onChange={(event) => onChange({ iban: event.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="accountNumber">رقم الحساب</Label>
            <Input
              id="accountNumber"
              value={form.accountNumber}
              onChange={(event) =>
                onChange({ accountNumber: event.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="swiftCode">Swift Code</Label>
            <Input
              id="swiftCode"
              value={form.swiftCode}
              onChange={(event) => onChange({ swiftCode: event.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="grid gap-1 text-right">
              <p className="text-sm font-medium">تفعيل الحساب</p>
              <p className="text-xs text-muted-foreground">
                الحسابات غير المفعلة لا تظهر للعميل عند الدفع.
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => onChange({ isActive: checked })}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="instructions">تعليمات التحويل</Label>
          <Textarea
            id="instructions"
            value={form.instructions}
            onChange={(event) => onChange({ instructions: event.target.value })}
            rows={5}
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-start">
          <Button onClick={onSubmit} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
            حفظ
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StripeDialog({
  open,
  form,
  onOpenChange,
  onChange,
  onSubmit,
  isSaving,
  isConfigured,
}: {
  open: boolean;
  form: StripeFormState;
  onOpenChange: (open: boolean) => void;
  onChange: (patch: Partial<StripeFormState>) => void;
  onSubmit: () => void;
  isSaving: boolean;
  isConfigured: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl">
        <DialogHeader className="text-right">
          <DialogTitle>إعداد Stripe</DialogTitle>
          <DialogDescription>
            اربط مفاتيح Stripe ثم فعّل البوابة عندما تصبح جاهزة للإنتاج.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="rounded-lg border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-1 text-right">
                <p className="text-sm font-medium">حالة الإعداد</p>
                <p className="text-xs text-muted-foreground">
                  {isConfigured
                    ? "البوابة تحتوي على الحقول الأساسية."
                    : "ما زالت بعض الحقول الأساسية غير مكتملة."}
                </p>
              </div>
              <Badge variant={isConfigured ? "default" : "secondary"}>
                {isConfigured ? "مكتمل" : "غير مكتمل"}
              </Badge>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="publishableKey">Publishable Key</Label>
            <Input
              id="publishableKey"
              value={form.publishableKey}
              onChange={(event) =>
                onChange({ publishableKey: event.target.value })
              }
              placeholder="pk_live_..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="secretKey">Secret Key</Label>
            <Input
              id="secretKey"
              type="password"
              value={form.secretKey}
              onChange={(event) => onChange({ secretKey: event.target.value })}
              placeholder="sk_live_..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="webhookSecret">Webhook Secret</Label>
            <Input
              id="webhookSecret"
              type="password"
              value={form.webhookSecret}
              onChange={(event) =>
                onChange({ webhookSecret: event.target.value })
              }
              placeholder="whsec_..."
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="grid gap-1 text-right">
              <p className="text-sm font-medium">تفعيل Stripe</p>
              <p className="text-xs text-muted-foreground">
                فعّلها فقط بعد التأكد من المفاتيح والويب هوك.
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => onChange({ isActive: checked })}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-start">
          <Button onClick={onSubmit} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
            حفظ إعدادات Stripe
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPaymentGatewaysPage() {
  const { data: gateways = [], isLoading: gatewaysLoading } =
    useGetAdminGatewaysQuery();
  const { data: bankAccounts = [], isLoading: bankAccountsLoading } =
    useGetAdminBankAccountsQuery();
  const { data: gatewayHealth = [], isLoading: healthLoading } =
    useGetAdminGatewaysHealthQuery();

  const [updateGateway, { isLoading: savingGateway }] =
    useUpdateAdminGatewayMutation();
  const [createBankAccount, { isLoading: creatingBankAccount }] =
    useCreateAdminBankAccountMutation();
  const [updateBankAccount, { isLoading: updatingBankAccount }] =
    useUpdateAdminBankAccountMutation();
  const [deleteBankAccount, { isLoading: deletingBankAccount }] =
    useDeleteAdminBankAccountMutation();
  const [checkHealth, { isLoading: checkingHealth }] =
    useCheckAdminGatewaysHealthMutation();

  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);
  const [stripeForm, setStripeForm] = useState<StripeFormState>({
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
    isActive: false,
  });

  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState<BankFormState>(EMPTY_BANK_FORM);

  const stripeGateway = useMemo(
    () => gateways.find((gateway) => gateway.name === "stripe"),
    [gateways],
  );
  const gatewaysByName = useMemo(
    () =>
      gateways.reduce<Record<string, Gateway>>((acc, gateway) => {
        acc[gateway.name] = gateway as Gateway;
        return acc;
      }, {}),
    [gateways],
  );

  const healthByName = useMemo(
    () =>
      gatewayHealth.reduce<Record<string, GatewayHealth>>((acc, item) => {
        acc[item.name] = item as GatewayHealth;
        return acc;
      }, {}),
    [gatewayHealth],
  );

  const metrics = useMemo(() => {
    const activeGateways = gateways.filter((gateway) => gateway.isActive).length;
    const configuredGateways = gateways.filter(
      (gateway) => gateway.configJson?.isConfigured,
    ).length;
    const activeBankAccounts = bankAccounts.filter((item) => item.isActive).length;
    const unhealthyGateways = gatewayHealth.filter(
      (item) => item.status && item.status !== "HEALTHY",
    ).length;

    return {
      activeGateways,
      configuredGateways,
      activeBankAccounts,
      unhealthyGateways,
    };
  }, [bankAccounts, gatewayHealth, gateways]);

  const paymentGateways = useMemo(() => {
    const preferredOrder = ["stripe", "bank_transfer"];
    const ordered = preferredOrder
      .map((name) => gatewaysByName[name])
      .filter(Boolean) as Gateway[];
    const remaining = gateways.filter(
      (gateway) => !preferredOrder.includes(gateway.name),
    );
    return [...ordered, ...remaining];
  }, [gateways, gatewaysByName]);

  const bankDialogSaving = creatingBankAccount || updatingBankAccount;

  const openStripeDialog = () => {
    setStripeForm({
      publishableKey: "",
      secretKey: "",
      webhookSecret: "",
      isActive: stripeGateway?.isActive ?? false,
    });
    setStripeDialogOpen(true);
  };

  const openCreateBankDialog = () => {
    setEditingBankId(null);
    setBankForm(EMPTY_BANK_FORM);
    setBankDialogOpen(true);
  };

  const openEditBankDialog = (account: BankAccount) => {
    setEditingBankId(account.id);
    setBankForm({
      bankName: account.bankName ?? "",
      accountName: account.accountName ?? "",
      accountNumber: account.accountNumber ?? "",
      iban: account.iban ?? "",
      swiftCode: account.swiftCode ?? "",
      instructions: account.instructions ?? "",
      isActive: account.isActive,
    });
    setBankDialogOpen(true);
  };

  const handleStripeSubmit = async () => {
    try {
      await updateGateway({
        name: "stripe",
        isActive: stripeForm.isActive,
        publishableKey: stripeForm.publishableKey || undefined,
        secretKey: stripeForm.secretKey || undefined,
        webhookSecret: stripeForm.webhookSecret || undefined,
      }).unwrap();
      toast.success("تم حفظ إعدادات Stripe");
      setStripeDialogOpen(false);
    } catch (error) {
      toast.error(safeErrorMessage(error, "تعذر حفظ إعدادات Stripe"));
    }
  };

  const handleBankGatewayToggle = async (checked: boolean) => {
    try {
      await updateGateway({
        name: "bank_transfer",
        isActive: checked,
      }).unwrap();
      toast.success(
        checked ? "تم تفعيل التحويل البنكي" : "تم إيقاف التحويل البنكي",
      );
    } catch (error) {
      toast.error(safeErrorMessage(error, "تعذر تحديث التحويل البنكي"));
    }
  };

  const handleGatewayToggle = async (gateway: Gateway, checked: boolean) => {
    if (gateway.name === "stripe" || gateway.name === "bank_transfer") {
      if (gateway.name === "bank_transfer") {
        await handleBankGatewayToggle(checked);
        return;
      }
      try {
        await updateGateway({
          name: gateway.name,
          isActive: checked,
        }).unwrap();
        toast.success(checked ? "تم تفعيل البوابة" : "تم إيقاف البوابة");
      } catch (error) {
        toast.error(safeErrorMessage(error, "تعذر تحديث حالة البوابة"));
      }
      return;
    }

    try {
      await updateGateway({ name: gateway.name, isActive: checked }).unwrap();
      toast.success(checked ? "تم تفعيل البوابة" : "تم إيقاف البوابة");
    } catch (error) {
      toast.error(safeErrorMessage(error, "تعذر تحديث حالة البوابة"));
    }
  };

  const handleBankSubmit = async () => {
    if (!bankForm.bankName.trim() || !bankForm.accountName.trim() || !bankForm.iban.trim()) {
      toast.error("اسم البنك واسم الحساب وIBAN مطلوبة");
      return;
    }

    const payload = {
      bankName: bankForm.bankName.trim(),
      accountName: bankForm.accountName.trim(),
      accountNumber: bankForm.accountNumber.trim() || undefined,
      iban: bankForm.iban.trim(),
      swiftCode: bankForm.swiftCode.trim() || undefined,
      instructions: bankForm.instructions.trim() || undefined,
      isActive: bankForm.isActive,
    };

    try {
      if (editingBankId) {
        await updateBankAccount({
          id: editingBankId,
          ...payload,
        }).unwrap();
        toast.success("تم تحديث الحساب البنكي");
      } else {
        await createBankAccount(payload).unwrap();
        toast.success("تمت إضافة الحساب البنكي");
      }
      setBankDialogOpen(false);
      setEditingBankId(null);
      setBankForm(EMPTY_BANK_FORM);
    } catch (error) {
      toast.error(safeErrorMessage(error, "تعذر حفظ الحساب البنكي"));
    }
  };

  const handleDeleteBank = async (account: BankAccount) => {
    const confirmed = window.confirm(
      `سيتم حذف حساب ${account.bankName}. هل تريد المتابعة؟`,
    );
    if (!confirmed) return;

    try {
      await deleteBankAccount(account.id).unwrap();
      toast.success("تم حذف الحساب البنكي");
    } catch (error) {
      toast.error(safeErrorMessage(error, "تعذر حذف الحساب البنكي"));
    }
  };

  const handleHealthCheck = async () => {
    try {
      await checkHealth().unwrap();
      toast.success("تم بدء فحص البوابات");
    } catch (error) {
      toast.error(safeErrorMessage(error, "تعذر تشغيل فحص البوابات"));
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10" dir="rtl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">بوابات الدفع</h1>
        <p className="text-sm text-muted-foreground">
          إدارة طرق الدفع المتاحة للعملاء، جاهزية Stripe، والحسابات البنكية التي
          تظهر داخل الفواتير والعقود.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="البوابات المفعلة"
          value={formatNumber(metrics.activeGateways)}
          description="طرق الدفع المتاحة فعليًا للعملاء"
          icon={BadgeCheck}
        />
        <MetricCard
          title="البوابات المكتملة"
          value={formatNumber(metrics.configuredGateways)}
          description="بوابات تحتوي على الإعدادات الأساسية"
          icon={Settings2}
        />
        <MetricCard
          title="الحسابات البنكية النشطة"
          value={formatNumber(metrics.activeBankAccounts)}
          description="الحسابات الظاهرة في التحويل البنكي"
          icon={Building2}
        />
        <MetricCard
          title="تحتاج متابعة"
          value={formatNumber(metrics.unhealthyGateways)}
          description="بوابات حالتها ليست سليمة"
          icon={ShieldAlert}
        />
      </div>

      <Tabs defaultValue="gateways" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="gateways">طرق الدفع</TabsTrigger>
          <TabsTrigger value="bank-accounts">الحسابات البنكية</TabsTrigger>
        </TabsList>

        <TabsContent value="gateways" className="mt-0 flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="grid gap-4">
              {gatewaysLoading ? (
                <>
                  <Skeleton className="h-48 rounded-xl" />
                  <Skeleton className="h-48 rounded-xl" />
                </>
              ) : paymentGateways.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <CreditCard />
                        </EmptyMedia>
                        <EmptyTitle>لا توجد بوابات حتى الآن</EmptyTitle>
                        <EmptyDescription>
                          عندما تتوفر البوابات من النظام ستظهر هنا لإدارتها.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </CardContent>
                </Card>
              ) : (
                paymentGateways.map((gateway) => {
                  const Icon = getGatewayIcon(gateway.name);
                  const health = healthByName[gateway.name];
                  const configured = gateway.configJson?.isConfigured ?? false;
                  const fields = gateway.configJson?.fields ?? {};
                  const configuredFields = Object.entries(fields).filter(
                    ([, value]) => Boolean(value),
                  ).length;
                  const totalFields = Object.keys(fields).length;

                  return (
                    <Card key={gateway.id}>
                      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg border bg-muted/40 p-3">
                            <Icon />
                          </div>
                          <div className="grid gap-2">
                            <CardTitle>{getGatewayLabel(gateway.name)}</CardTitle>
                            <CardDescription>
                              {GATEWAY_HELP[gateway.name] ??
                                "بوابة دفع متصلة بالنظام."}
                            </CardDescription>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant={gateway.isActive ? "default" : "secondary"}>
                                {gateway.isActive ? "مفعلة" : "متوقفة"}
                              </Badge>
                              <Badge variant={configured ? "outline" : "secondary"}>
                                {configured ? "إعداد مكتمل" : "إعداد ناقص"}
                              </Badge>
                              <Badge variant={getHealthVariant(health?.status)}>
                                {getHealthLabel(health?.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                            <span className="text-sm text-muted-foreground">
                              {gateway.isActive ? "تشغيل" : "إيقاف"}
                            </span>
                            <Switch
                              checked={gateway.isActive}
                              disabled={savingGateway}
                              onCheckedChange={(checked) =>
                                handleGatewayToggle(gateway, checked)
                              }
                            />
                          </div>
                          {gateway.name === "stripe" ? (
                            <Button variant="outline" onClick={openStripeDialog}>
                              <Settings2 data-icon="inline-start" />
                              إعداد Stripe
                            </Button>
                          ) : null}
                        </div>
                      </CardHeader>

                      <CardContent className="grid gap-4 md:grid-cols-3">
                        <InfoBlock
                          label="الحقول المكتملة"
                          value={
                            totalFields > 0
                              ? `${configuredFields}/${totalFields}`
                              : "—"
                          }
                          hint="يعطيك فكرة سريعة عن جاهزية الربط"
                        />
                        <InfoBlock
                          label="آخر تحديث"
                          value={formatDateTime(gateway.updatedAt, "ar-SA-u-nu-latn")}
                          hint="آخر تعديل محفوظ على إعدادات البوابة"
                        />
                        <InfoBlock
                          label="آخر فحص"
                          value={formatDateTime(
                            health?.lastCheckedAt,
                            "ar-SA-u-nu-latn",
                          )}
                          hint={
                            health?.error
                              ? `المشكلة: ${health.error}`
                              : "لا توجد ملاحظات تشغيلية مسجلة"
                          }
                          tone={health?.error ? "critical" : "default"}
                        />
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div className="grid gap-1">
                  <CardTitle>صحة البوابات</CardTitle>
                  <CardDescription>
                    متابعة التشغيل تساعدك قبل أن تظهر مشاكل الدفع للعميل.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={handleHealthCheck}
                  disabled={checkingHealth}
                >
                  <RefreshCw
                    data-icon="inline-start"
                    className={cn(checkingHealth && "animate-spin")}
                  />
                  فحص الآن
                </Button>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-14 rounded-lg" />
                    <Skeleton className="h-14 rounded-lg" />
                  </div>
                ) : gatewayHealth.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Activity />
                      </EmptyMedia>
                      <EmptyTitle>لا توجد نتائج فحص بعد</EmptyTitle>
                      <EmptyDescription>
                        شغّل فحص الصحة للحصول على صورة أوضح عن حالة البوابات.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="flex flex-col gap-3">
                    {gatewayHealth.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="grid gap-1">
                            <p className="font-medium">
                              {getGatewayLabel(item.name)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              آخر فحص:{" "}
                              {formatDateTime(
                                item.lastCheckedAt,
                                "ar-SA-u-nu-latn",
                              )}
                            </p>
                          </div>
                          <Badge variant={getHealthVariant(item.status)}>
                            {getHealthLabel(item.status)}
                          </Badge>
                        </div>
                        {item.error ? (
                          <p className="mt-3 text-sm text-destructive">
                            {item.error}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bank-accounts" className="mt-0">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div className="grid gap-1">
                <CardTitle>الحسابات البنكية المتاحة للعملاء</CardTitle>
                <CardDescription>
                  هذه الحسابات تظهر للعميل عندما تكون بوابة التحويل البنكي مفعلة.
                </CardDescription>
              </div>
              <Button onClick={openCreateBankDialog}>
                <Plus data-icon="inline-start" />
                إضافة حساب
              </Button>
            </CardHeader>
            <CardContent>
              {bankAccountsLoading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-14 rounded-lg" />
                  <Skeleton className="h-14 rounded-lg" />
                  <Skeleton className="h-14 rounded-lg" />
                </div>
              ) : bankAccounts.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Landmark />
                    </EmptyMedia>
                    <EmptyTitle>لا توجد حسابات بنكية بعد</EmptyTitle>
                    <EmptyDescription>
                      أضف حسابًا واحدًا على الأقل قبل تفعيل التحويل البنكي للعملاء.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button onClick={openCreateBankDialog}>
                      <Plus data-icon="inline-start" />
                      إضافة أول حساب
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>البنك</TableHead>
                      <TableHead>صاحب الحساب</TableHead>
                      <TableHead>IBAN</TableHead>
                      <TableHead>رقم الحساب</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>أضيف في</TableHead>
                      <TableHead className="w-[180px]">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">
                          {account.bankName}
                        </TableCell>
                        <TableCell>{account.accountName}</TableCell>
                        <TableCell>{compactMask(account.iban)}</TableCell>
                        <TableCell>{compactMask(account.accountNumber)}</TableCell>
                        <TableCell>
                          <Badge variant={account.isActive ? "default" : "secondary"}>
                            {account.isActive ? "نشط" : "مخفي"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDateTime(account.createdAt, "ar-SA-u-nu-latn")}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditBankDialog(account as BankAccount)}
                            >
                              تعديل
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteBank(account as BankAccount)}
                              disabled={deletingBankAccount}
                            >
                              <Trash2 data-icon="inline-start" />
                              حذف
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <StripeDialog
        open={stripeDialogOpen}
        form={stripeForm}
        onOpenChange={setStripeDialogOpen}
        onChange={(patch) =>
          setStripeForm((current) => ({ ...current, ...patch }))
        }
        onSubmit={handleStripeSubmit}
        isSaving={savingGateway}
        isConfigured={stripeGateway?.configJson?.isConfigured ?? false}
      />

      <BankAccountDialog
        open={bankDialogOpen}
        title={editingBankId ? "تعديل الحساب البنكي" : "إضافة حساب بنكي"}
        description={
          editingBankId
            ? "حدّث بيانات الحساب الذي يظهر للعملاء داخل التحويل البنكي."
            : "أضف حسابًا بنكيًا جديدًا ليظهر للعملاء عند اختيار التحويل البنكي."
        }
        form={bankForm}
        isSaving={bankDialogSaving}
        onOpenChange={(open) => {
          setBankDialogOpen(open);
          if (!open) {
            setEditingBankId(null);
            setBankForm(EMPTY_BANK_FORM);
          }
        }}
        onChange={(patch) => setBankForm((current) => ({ ...current, ...patch }))}
        onSubmit={handleBankSubmit}
      />
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof CreditCard;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="grid gap-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <Icon />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function InfoBlock({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "critical";
}) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
      <p
        className={cn(
          "mt-2 text-xs text-muted-foreground",
          tone === "critical" && "text-destructive",
        )}
      >
        {hint}
      </p>
    </div>
  );
}
