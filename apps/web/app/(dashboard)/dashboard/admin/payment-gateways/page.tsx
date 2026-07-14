"use client";

import { useState } from "react";
import {
  CreditCard,
  Building2,
  Plus,
  Settings2,
  Trash2,
  RefreshCw,
  Pencil,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable, type DataTableColumn } from "@/components/design-system/DataTable";
import { Switch } from "@/components/design-system/Switch";
import { cn } from "@/lib/utils";
import {
  useGetAdminGatewaysQuery,
  useUpdateAdminGatewayMutation,
  useGetAdminBankAccountsQuery,
  useCreateAdminBankAccountMutation,
  useUpdateAdminBankAccountMutation,
  useDeleteAdminBankAccountMutation,
  useGetAdminGatewaysHealthQuery,
  useCheckAdminGatewaysHealthMutation,
} from "@/features/admin/adminFinanceApi";
import { PAYMENT_GATEWAY_TYPE_AR, PaymentGatewayType } from "@hassad/shared";

/* ──────────────────────────────────────────────
   Unified Payment Method Type
   ────────────────────────────────────────────── */
type PaymentMethodRow = {
  id: string;
  name: string;
  type: "gateway" | "bank_account";
  gatewayType?: PaymentGatewayType;
  isActive: boolean;
  isConfigured: boolean;
  configFields?: Record<string, boolean>;
};

/* ──────────────────────────────────────────────
   Shared modal backdrop
   ────────────────────────────────────────────── */
function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function ModalPanel({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" dir="rtl">
      <h3 className="text-lg font-semibold text-natural-100 mb-4">{title}</h3>
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Add Gateway Modal (tabs: Stripe | Bank Transfer)
   ────────────────────────────────────────────── */
function AddGatewayModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"stripe" | "bank">("stripe");
  
  // Stripe form
  const [stripeForm, setStripeForm] = useState({ secretKey: "", webhookSecret: "", publishableKey: "" });
  const [stripeActive, setStripeActive] = useState(true);
  
  // Bank transfer form  
  const [bankForm, setBankForm] = useState({
    bankName: "", accountName: "", accountNumber: "", iban: "",
    swiftCode: "", instructions: "", isActive: true
  });

  const [updateGateway, { isLoading: isSavingGateway }] = useUpdateAdminGatewayMutation();
  const [createBank, { isLoading: isCreatingBank }] = useCreateAdminBankAccountMutation();

  if (!open) return null;

  const handleStripeSubmit = async () => {
    if (!stripeForm.secretKey && !stripeForm.webhookSecret && !stripeForm.publishableKey) return;
    try {
      await updateGateway({
        name: "stripe",
        isActive: stripeActive,
        secretKey: stripeForm.secretKey || undefined,
        webhookSecret: stripeForm.webhookSecret || undefined,
        publishableKey: stripeForm.publishableKey || undefined,
      }).unwrap();
      setStripeForm({ secretKey: "", webhookSecret: "", publishableKey: "" });
      onClose();
    } catch {}
  };

  const handleBankSubmit = async () => {
    if (!bankForm.bankName || !bankForm.accountName || !bankForm.iban) return;
    try {
      await createBank({
        bankName: bankForm.bankName,
        accountName: bankForm.accountName,
        accountNumber: bankForm.accountNumber,
        iban: bankForm.iban,
        swiftCode: bankForm.swiftCode || undefined,
        instructions: bankForm.instructions || undefined,
      }).unwrap();
      setBankForm({ bankName: "", accountName: "", accountNumber: "", iban: "", swiftCode: "", instructions: "", isActive: true });
      onClose();
    } catch {}
  };

  const isLoading = isSavingGateway || isCreatingBank;

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalPanel title="إضافة طريقة دفع" onClose={onClose}>
        {/* Tabs */}
        <div className="flex border-b border-portal-card-border mb-4">
          <button
            onClick={() => setActiveTab("stripe")}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === "stripe"
                ? "border-secondary-500 text-secondary-500"
                : "border-transparent text-portal-note-text hover:text-natural-100"
            )}
          >
            Stripe
          </button>
          <button
            onClick={() => setActiveTab("bank")}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === "bank"
                ? "border-secondary-500 text-secondary-500"
                : "border-transparent text-portal-note-text hover:text-natural-100"
            )}
          >
            تحويل بنكي
          </button>
        </div>

        {/* Stripe Form */}
        {activeTab === "stripe" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-natural-100">تفعيل البوابة</span>
              <Switch checked={stripeActive} onCheckedChange={setStripeActive} />
            </div>
            <div>
              <label className="text-xs text-portal-note-text block mb-1">المفتاح السري (Secret Key)</label>
              <input
                className="w-full rounded-xl border border-portal-card-border p-3 text-sm dir-ltr text-left"
                type="password"
                placeholder="sk_live_..."
                value={stripeForm.secretKey}
                onChange={(e) => setStripeForm({ ...stripeForm, secretKey: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-portal-note-text block mb-1">مفتاح Webhook</label>
              <input
                className="w-full rounded-xl border border-portal-card-border p-3 text-sm dir-ltr text-left"
                type="password"
                placeholder="whsec_..."
                value={stripeForm.webhookSecret}
                onChange={(e) => setStripeForm({ ...stripeForm, webhookSecret: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-portal-note-text block mb-1">المفتاح العام (Publishable Key)</label>
              <input
                className="w-full rounded-xl border border-portal-card-border p-3 text-sm dir-ltr text-left"
                type="password"
                placeholder="pk_live_..."
                value={stripeForm.publishableKey}
                onChange={(e) => setStripeForm({ ...stripeForm, publishableKey: e.target.value })}
              />
            </div>
            <button
              onClick={handleStripeSubmit}
              disabled={isLoading}
              className="w-full rounded-xl py-2.5 text-sm font-medium text-white bg-secondary-500 hover:bg-secondary-600 disabled:opacity-50 mt-2"
            >
              {isLoading ? "جاري الحفظ..." : "حفظ Stripe"}
            </button>
          </div>
        )}

        {/* Bank Transfer Form */}
        {activeTab === "bank" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-portal-note-text block mb-1">اسم البنك</label>
              <input className="w-full rounded-xl border border-portal-card-border p-3 text-sm" value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-portal-note-text block mb-1">اسم صاحب الحساب</label>
              <input className="w-full rounded-xl border border-portal-card-border p-3 text-sm" value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-portal-note-text block mb-1">رقم الحساب</label>
              <input className="w-full rounded-xl border border-portal-card-border p-3 text-sm" value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-portal-note-text block mb-1">IBAN</label>
              <input className="w-full rounded-xl border border-portal-card-border p-3 text-sm" value={bankForm.iban} onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-portal-note-text block mb-1">SWIFT (اختياري)</label>
              <input className="w-full rounded-xl border border-portal-card-border p-3 text-sm" value={bankForm.swiftCode} onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-portal-note-text block mb-1">تعليمات التحويل (اختياري)</label>
              <textarea className="w-full rounded-xl border border-portal-card-border p-3 text-sm resize-none" rows={2} value={bankForm.instructions} onChange={(e) => setBankForm({ ...bankForm, instructions: e.target.value })} />
            </div>
            <button
              onClick={handleBankSubmit}
              disabled={isLoading || !bankForm.bankName || !bankForm.accountName || !bankForm.iban}
              className="w-full rounded-xl py-2.5 text-sm font-medium text-white bg-secondary-500 hover:bg-secondary-600 disabled:opacity-50 mt-2"
            >
              {isLoading ? "جاري الإضافة..." : "إضافة حساب بنكي"}
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-xl py-2.5 text-sm font-medium border border-portal-card-border text-portal-note-text hover:text-natural-100 mt-3"
        >
          إلغاء
        </button>
      </ModalPanel>
    </ModalBackdrop>
  );
}

/* ──────────────────────────────────────────────
   Edit Bank Account Modal
   ────────────────────────────────────────────── */
function EditBankModal({
  open,
  bank,
  onClose,
}: {
  open: boolean;
  bank: any;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    bankName: bank?.bankName ?? "",
    accountName: bank?.accountName ?? "",
    accountNumber: bank?.accountNumber ?? "",
    iban: bank?.iban ?? "",
    swiftCode: bank?.swiftCode ?? "",
    instructions: bank?.instructions ?? "",
  });
  const [update, { isLoading }] = useUpdateAdminBankAccountMutation();

  if (!open || !bank) return null;

  const handleSubmit = async () => {
    if (!form.bankName || !form.accountName || !form.iban) return;
    try {
      await update({ id: bank.id, ...form }).unwrap();
      onClose();
    } catch {}
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalPanel title="تعديل حساب بنكي" onClose={onClose}>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-portal-note-text block mb-1">اسم البنك</label>
            <input className="w-full rounded-xl border border-portal-card-border p-3 text-sm" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-portal-note-text block mb-1">اسم صاحب الحساب</label>
            <input className="w-full rounded-xl border border-portal-card-border p-3 text-sm" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-portal-note-text block mb-1">رقم الحساب</label>
            <input className="w-full rounded-xl border border-portal-card-border p-3 text-sm" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-portal-note-text block mb-1">IBAN</label>
            <input className="w-full rounded-xl border border-portal-card-border p-3 text-sm" value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-portal-note-text block mb-1">SWIFT (اختياري)</label>
            <input className="w-full rounded-xl border border-portal-card-border p-3 text-sm" value={form.swiftCode} onChange={(e) => setForm({ ...form, swiftCode: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-portal-note-text block mb-1">تعليمات التحويل (اختياري)</label>
            <textarea className="w-full rounded-xl border border-portal-card-border p-3 text-sm resize-none" rows={2} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !form.bankName || !form.accountName || !form.iban}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white bg-secondary-500 hover:bg-secondary-600 disabled:opacity-50"
          >
            {isLoading ? "جاري الحفظ..." : "حفظ"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium border border-portal-card-border text-portal-note-text hover:text-natural-100"
          >
            إلغاء
          </button>
        </div>
      </ModalPanel>
    </ModalBackdrop>
  );
}

/* ──────────────────────────────────────────────
   Configure Gateway Modal (Stripe keys)
   ────────────────────────────────────────────── */
function ConfigureGatewayModal({
  open,
  gateway,
  onClose,
}: {
  open: boolean;
  gateway: { name: string; configJson: { fields: Record<string, boolean>; isConfigured: boolean } | null } | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ secretKey: "", webhookSecret: "", publishableKey: "" });
  const [isActive, setIsActive] = useState(gateway?.configJson?.isConfigured ?? true);
  const [update, { isLoading }] = useUpdateAdminGatewayMutation();

  if (!open || !gateway) return null;

  const handleSubmit = async () => {
    const body: Record<string, string> = {};
    if (form.secretKey) body.secretKey = form.secretKey;
    if (form.webhookSecret) body.webhookSecret = form.webhookSecret;
    if (form.publishableKey) body.publishableKey = form.publishableKey;
    if (!Object.keys(body).length && form.secretKey === "") return;
    try {
      await update({ name: gateway.name, isActive, ...body }).unwrap();
      setForm({ secretKey: "", webhookSecret: "", publishableKey: "" });
      onClose();
    } catch {}
  };

  const existingKeys = gateway.configJson?.fields ? 
    Object.entries(gateway.configJson.fields).filter(([, v]) => v).map(([k]) => k) : [];

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalPanel title={`تكوين ${gateway.name === "stripe" ? "Stripe" : "تحويل بنكي"}`} onClose={onClose}>
        <div className="flex items-center justify-between py-2 mb-2">
          <span className="text-sm text-natural-100">تفعيل البوابة</span>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
        
        {existingKeys.length > 0 && (
          <p className="text-xs text-portal-note-text mb-3">
            تم تكوين: {existingKeys.join("، ")}
            {" — "}اترك الحقل فارغاً للاحتفاظ بالقيمة الحالية.
          </p>
        )}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-portal-note-text block mb-1">المفتاح السري</label>
            <input
              className="w-full rounded-xl border border-portal-card-border p-3 text-sm dir-ltr text-left"
              type="password"
              placeholder={gateway.configJson?.fields?.secretKey ? "•••••••• (موجود)" : "أدخل المفتاح..."}
              value={form.secretKey}
              onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-portal-note-text block mb-1">مفتاح Webhook</label>
            <input
              className="w-full rounded-xl border border-portal-card-border p-3 text-sm dir-ltr text-left"
              type="password"
              placeholder={gateway.configJson?.fields?.webhookSecret ? "•••••••• (موجود)" : "أدخل المفتاح..."}
              value={form.webhookSecret}
              onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-portal-note-text block mb-1">المفتاح العام</label>
            <input
              className="w-full rounded-xl border border-portal-card-border p-3 text-sm dir-ltr text-left"
              type="password"
              placeholder={gateway.configJson?.fields?.publishableKey ? "•••••••• (موجود)" : "أدخل المفتاح..."}
              value={form.publishableKey}
              onChange={(e) => setForm({ ...form, publishableKey: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading || (!form.secretKey && !form.webhookSecret && !form.publishableKey)}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white bg-secondary-500 hover:bg-secondary-600 disabled:opacity-50"
          >
            {isLoading ? "جاري الحفظ..." : "حفظ"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium border border-portal-card-border text-portal-note-text hover:text-natural-100"
          >
            إلغاء
          </button>
        </div>
      </ModalPanel>
    </ModalBackdrop>
  );
}

/* ──────────────────────────────────────────────
   Page
   ────────────────────────────────────────────── */
export default function AdminPaymentGatewaysPage() {
  const [showAddGateway, setShowAddGateway] = useState(false);
  const [configGateway, setConfigGateway] = useState<{ name: string; configJson: any } | null>(null);
  const [editBank, setEditBank] = useState<any>(null);

  const { data: gateways, isLoading: loadingGateways, isError: errorGateways } = useGetAdminGatewaysQuery();
  const { data: banks, isLoading: loadingBanks, isError: errorBanks } = useGetAdminBankAccountsQuery();
  const { data: healthData, isLoading: loadingHealth } = useGetAdminGatewaysHealthQuery();
  const [checkHealth, { isLoading: checkingHealth }] = useCheckAdminGatewaysHealthMutation();
  const [updateGateway] = useUpdateAdminGatewayMutation();
  const [deleteBank] = useDeleteAdminBankAccountMutation();

  // Build unified rows
  const rows: PaymentMethodRow[] = [
    // Gateways first
    ...(gateways ?? []).map((gw) => ({
      id: gw.id,
      name: gw.name === "stripe" ? "Stripe" : gw.name === "bank_transfer" ? "تحويل بنكي" : gw.name,
      type: "gateway" as const,
      gatewayType: gw.type as PaymentGatewayType,
      isActive: gw.isActive,
      isConfigured: gw.configJson?.isConfigured ?? false,
      configFields: gw.configJson?.fields,
    })),
    // Then bank accounts
    ...(banks ?? []).map((ba) => ({
      id: ba.id,
      name: `${ba.bankName} - ${ba.accountName}`,
      type: "bank_account" as const,
      gatewayType: PaymentGatewayType.MANUAL,
      isActive: ba.isActive,
      isConfigured: true,
    })),
  ];

  const columns: DataTableColumn[] = [
    { id: "name", label: "طريقة الدفع" },
    { id: "type", label: "النوع", align: "center" },
    { id: "status", label: "الحالة", align: "center" },
    { id: "config", label: "الإعدادات", align: "center" },
    { id: "health", label: "الصحة", align: "center" },
    { id: "actions", label: "", align: "left" },
  ];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="بوابات الدفع"
        description="إدارة بوابات الدفع والحسابات البنكية"
        icon={CreditCard}
      />

      {/* ───── Unified Payment Methods Table ───── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-natural-100">طرق الدفع</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => checkHealth()}
            disabled={checkingHealth}
            className="flex items-center gap-1.5 text-sm text-portal-note-text hover:text-natural-100"
          >
            <RefreshCw className={cn("h-4 w-4", checkingHealth && "animate-spin")} />
            فحص الصحة
          </button>
          <button
            onClick={() => setShowAddGateway(true)}
            className="flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-600"
          >
            <Plus className="h-4 w-4" />
            إضافة
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={loadingGateways || loadingBanks}
        isError={errorGateways || errorBanks}
        emptyState={{
          icon: CreditCard,
          message: "لا توجد طرق دفع",
          hint: "أضف بوابة دفع أو حساباً بنكياً للبدء.",
        }}
        renderCells={(row) => {
          const health = (healthData ?? []).find((h) => h.name === (row.name === "Stripe" ? "stripe" : row.name === "تحويل بنكي" ? "bank_transfer" : ""));
          const isGateway = row.type === "gateway";
          
          return [
            <td key="name" className="px-5 py-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center",
                  row.isActive ? "bg-success-100" : "bg-portal-divider",
                )}>
                  <CreditCard className={cn("h-4 w-4", row.isActive ? "text-success-600" : "text-portal-note-text")} />
                </div>
                <div>
                  <p className="text-sm font-medium text-natural-100">{row.name}</p>
                  {!row.isConfigured && row.type === "gateway" && (
                    <p className="text-xs text-warning-600">مفاتيح غير مكونة</p>
                  )}
                </div>
              </div>
            </td>,
            <td key="type" className="px-5 py-4 text-center">
              <span className="text-xs text-portal-note-text">
                {row.gatewayType ? PAYMENT_GATEWAY_TYPE_AR[row.gatewayType] : "يدوي"}
              </span>
            </td>,
            <td key="status" className="px-5 py-4 text-center">
              {isGateway ? (
                <Switch
                  checked={row.isActive}
                  onCheckedChange={() => updateGateway({ name: row.name === "Stripe" ? "stripe" : "bank_transfer", isActive: !row.isActive })}
                />
              ) : (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  row.isActive ? "bg-success-100 text-success-700" : "bg-portal-divider text-portal-note-text",
                )}>
                  {row.isActive ? "نشط" : "غير نشط"}
                </span>
              )}
            </td>,
            <td key="config" className="px-5 py-4 text-center">
              {isGateway ? (
                <span className={cn(
                  "inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium",
                  row.isConfigured
                    ? "bg-success-100 text-success-700"
                    : "bg-warning-100 text-warning-700",
                )}>
                  {row.isConfigured ? (
                    <><CheckCircle className="h-3 w-3" /> مكونة</>
                  ) : (
                    <><XCircle className="h-3 w-3" /> غير مكونة</>
                  )}
                </span>
              ) : (
                <span className="text-xs text-portal-note-text">—</span>
              )}
            </td>,
            <td key="health" className="px-5 py-4 text-center">
              {isGateway && health ? (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  health.status === "healthy" ? "bg-success-100 text-success-700" :
                  health.status === "degraded" ? "bg-warning-100 text-warning-700" :
                  "bg-danger-100 text-danger-700",
                )}>
                  {health.status === "healthy" ? "سليمة" :
                   health.status === "degraded" ? "منخفضة" : "متوقفة"}
                </span>
              ) : isGateway ? (
                <span className="text-xs text-portal-note-text">—</span>
              ) : (
                <span className="text-xs text-portal-note-text">—</span>
              )}
            </td>,
            <td key="actions" className="px-5 py-4 text-left">
              {isGateway ? (
                <button
                  onClick={() => setConfigGateway({ name: row.name === "Stripe" ? "stripe" : "bank_transfer", configJson: { fields: row.configFields, isConfigured: row.isConfigured } })}
                  className="inline-flex items-center gap-1 text-xs text-secondary-500 hover:text-secondary-600 font-medium"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  تكوين
                </button>
              ) : (
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setEditBank(row)}
                    className="text-portal-note-text hover:text-natural-100 p-1"
                    title="تعديل"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm("حذف الحساب البنكي؟")) deleteBank(row.id); }}
                    className="text-danger-500 hover:text-danger-600 p-1"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </td>,
          ];
        }}
      />

      {/* ───── Modals ───── */}
      <AddGatewayModal open={showAddGateway} onClose={() => setShowAddGateway(false)} />
      <ConfigureGatewayModal
        open={!!configGateway}
        gateway={configGateway}
        onClose={() => setConfigGateway(null)}
      />
      <EditBankModal open={!!editBank} bank={editBank} onClose={() => setEditBank(null)} />
    </div>
  );
}