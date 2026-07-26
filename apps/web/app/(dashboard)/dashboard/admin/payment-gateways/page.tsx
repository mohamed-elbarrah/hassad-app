"use client";

import { useCallback, useState } from "react";
import {
  CreditCard,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable, type DataTableColumn } from "@/components/design-system/DataTable";
import { Switch } from "@/components/design-system/Switch";
import { cn } from "@/lib/utils";
import {
  useGetAdminGatewaysQuery,
  useUpdateAdminGatewayMutation,
  useDeleteAdminGatewayMutation,
  useGetAdminBankAccountsQuery,
  useCreateAdminBankAccountMutation,
  useUpdateAdminBankAccountMutation,
  useDeleteAdminBankAccountMutation,
} from "@/features/admin/adminFinanceApi";

/* ── Modal primitives ── */
function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function ModalOuter({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" dir="rtl">
      <h3 className="text-lg font-semibold text-natural-100 mb-4">{title}</h3>
      {children}
    </div>
  );
}

/* ── Payment method modal (add stripe / add bank) ── */
function AddMethodModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"stripe" | "bank">("stripe");
  const [sKeys, setSKeys] = useState({ secretKey: "", webhookSecret: "", publishableKey: "" });
  const [sActive, setSActive] = useState(true);
  const [bForm, setBForm] = useState({
    bankName: "", accountName: "", accountNumber: "", iban: "", swiftCode: "", instructions: "",
  });
  const [bActive, setBActive] = useState(true);
  const [error, setError] = useState("");

  const [updateGw, { isLoading: gwSaving }] = useUpdateAdminGatewayMutation();
  const [createBa, { isLoading: baSaving }] = useCreateAdminBankAccountMutation();
  const saving = gwSaving || baSaving;

  const reset = useCallback(() => {
    setSKeys({ secretKey: "", webhookSecret: "", publishableKey: "" });
    setSActive(true);
    setBForm({ bankName: "", accountName: "", accountNumber: "", iban: "", swiftCode: "", instructions: "" });
    setBActive(true);
    setError("");
  }, []);

  if (!open) return null;

  const submitStripe = async () => {
    if (!sKeys.secretKey && !sKeys.webhookSecret && !sKeys.publishableKey) {
      setError("يرجى إدخال مفتاح واحد على الأقل");
      return;
    }
    setError("");
    const body: Record<string, string | boolean> = { isActive: sActive };
    if (sKeys.secretKey) body.secretKey = sKeys.secretKey;
    if (sKeys.webhookSecret) body.webhookSecret = sKeys.webhookSecret;
    if (sKeys.publishableKey) body.publishableKey = sKeys.publishableKey;
    try {
      await updateGw({ name: "stripe", ...body } as any).unwrap();
      reset();
      onClose();
    } catch { setError("فشل الحفظ، يرجى المحاولة مرة أخرى"); }
  };

  const submitBank = async () => {
    if (!bForm.bankName || !bForm.accountName || !bForm.iban) {
      setError("يرجى ملء الحقول المطلوبة");
      return;
    }
    setError("");
    try {
      await createBa({
        ...bForm, swiftCode: bForm.swiftCode || undefined, instructions: bForm.instructions || undefined, isActive: bActive,
      }).unwrap();
      reset();
      onClose();
    } catch { setError("فشل الإضافة، يرجى المحاولة مرة أخرى"); }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalOuter title="إضافة طريقة دفع">
        <div className="flex border-b border-portal-card-border mb-4">
          {(["stripe", "bank"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); }}
              className={cn("flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors",
                tab === t ? "border-secondary-500 text-secondary-500" : "border-transparent text-portal-note-text hover:text-natural-100"
              )}>
              {t === "stripe" ? "stripe" : "bank_transfer"}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-danger-600 mb-3">{error}</p>}

        {tab === "stripe" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-natural-100">تفعيل</span>
              <Switch checked={sActive} onCheckedChange={setSActive} />
            </div>
            {([["secretKey", "المفتاح السري"], ["webhookSecret", "مفتاح Webhook"], ["publishableKey", "المفتاح العام"]] as const).map(([k, label]) => (
              <div key={k}>
                <label className="text-xs text-portal-note-text block mb-1">{label}</label>
                <input className="w-full rounded-xl border border-portal-card-border p-3 text-sm dir-ltr text-left" type="password"
                  placeholder={sKeys[k] ? "••••••••" : "أدخل المفتاح..."}
                  value={sKeys[k]} onChange={(e) => setSKeys({ ...sKeys, [k]: e.target.value })} />
              </div>
            ))}
            <button onClick={submitStripe} disabled={saving}
              className="w-full rounded-xl py-2.5 text-sm font-medium text-white bg-secondary-500 hover:bg-secondary-600 disabled:opacity-50"
            >{saving ? "..." : "حفظ"}</button>
          </div>
        )}

        {tab === "bank" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-natural-100">تفعيل</span>
              <Switch checked={bActive} onCheckedChange={setBActive} />
            </div>
            {(["bankName", "accountName", "accountNumber", "iban", "swiftCode"] as const).map((f) => (
              <div key={f}>
                <label className="text-xs text-portal-note-text block mb-1">
                  {{ bankName: "اسم البنك", accountName: "صاحب الحساب", accountNumber: "رقم الحساب", iban: "IBAN", swiftCode: "SWIFT" }[f]}
                </label>
                <input className="w-full rounded-xl border border-portal-card-border p-3 text-sm"
                  value={bForm[f]} onChange={(e) => setBForm({ ...bForm, [f]: e.target.value })} />
              </div>
            ))}
            <div>
              <label className="text-xs text-portal-note-text block mb-1">تعليمات التحويل</label>
              <textarea className="w-full rounded-xl border border-portal-card-border p-3 text-sm resize-none" rows={2}
                value={bForm.instructions} onChange={(e) => setBForm({ ...bForm, instructions: e.target.value })} />
            </div>
            <button onClick={submitBank} disabled={saving || !bForm.bankName || !bForm.accountName || !bForm.iban}
              className="w-full rounded-xl py-2.5 text-sm font-medium text-white bg-secondary-500 hover:bg-secondary-600 disabled:opacity-50"
            >{saving ? "..." : "إضافة"}</button>
          </div>
        )}

        <button onClick={onClose}
          className="w-full rounded-xl py-2.5 text-sm font-medium border border-portal-card-border text-portal-note-text hover:text-natural-100 mt-3"
        >إلغاء</button>
      </ModalOuter>
    </ModalBackdrop>
  );
}

/* ── Edit Stripe modal ── */
function EditStripeModal({ open, stripeGw, onClose }: {
  open: boolean;
  stripeGw: { isActive: boolean; isConfigured: boolean; fields: Record<string, boolean> } | null;
  onClose: () => void;
}) {
  const [keys, setKeys] = useState({ secretKey: "", webhookSecret: "", publishableKey: "" });
  const [isActive, setIsActive] = useState(stripeGw?.isActive ?? true);
  const [error, setError] = useState("");
  const [update, { isLoading }] = useUpdateAdminGatewayMutation();

  if (!open || !stripeGw) return null;

  const submit = async () => {
    setError("");
    const body: Record<string, string | boolean> = { isActive };
    if (keys.secretKey) body.secretKey = keys.secretKey;
    if (keys.webhookSecret) body.webhookSecret = keys.webhookSecret;
    if (keys.publishableKey) body.publishableKey = keys.publishableKey;
    try {
      await update({ name: "stripe", ...body } as any).unwrap();
      setKeys({ secretKey: "", webhookSecret: "", publishableKey: "" });
      onClose();
    } catch { setError("فشل الحفظ"); }
  };

  const existingKeys = Object.entries(stripeGw.fields).filter(([, v]) => v).map(([k]) => k);

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalOuter title="تعديل Stripe">
        {error && <p className="text-xs text-danger-600 mb-3">{error}</p>}
        <div className="flex items-center justify-between py-2 mb-2">
          <span className="text-sm text-natural-100">تفعيل</span>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
        {existingKeys.length > 0 && (
          <p className="text-xs text-portal-note-text mb-3">
            تم تكوين: {existingKeys.join("، ")} — اترك الحقل فارغاً للاحتفاظ بالقيمة الحالية.
          </p>
        )}
        <div className="space-y-3">
          {([["secretKey", "المفتاح السري"], ["webhookSecret", "مفتاح Webhook"], ["publishableKey", "المفتاح العام"]] as const).map(([k, label]) => (
            <div key={k}>
              <label className="text-xs text-portal-note-text block mb-1">{label}</label>
              <input className="w-full rounded-xl border border-portal-card-border p-3 text-sm dir-ltr text-left" type="password"
                placeholder={stripeGw.fields[k] ? "••••••••" : "أدخل المفتاح..."}
                value={keys[k]} onChange={(e) => setKeys({ ...keys, [k]: e.target.value })} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={submit} disabled={isLoading}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white bg-secondary-500 hover:bg-secondary-600 disabled:opacity-50"
          >{isLoading ? "..." : "حفظ"}</button>
          <button onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium border border-portal-card-border text-portal-note-text hover:text-natural-100"
          >إلغاء</button>
        </div>
      </ModalOuter>
    </ModalBackdrop>
  );
}

/* ── Edit Bank Account modal ── */
function EditBankModal({ open, bank, onClose }: { open: boolean; bank: any; onClose: () => void }) {
  const [form, setForm] = useState({
    bankName: bank?.bankName ?? "", accountName: bank?.accountName ?? "",
    accountNumber: bank?.accountNumber ?? "", iban: bank?.iban ?? "",
    swiftCode: bank?.swiftCode ?? "", instructions: bank?.instructions ?? "",
  });
  const [isActive, setIsActive] = useState(bank?.isActive ?? true);
  const [error, setError] = useState("");
  const [update, { isLoading }] = useUpdateAdminBankAccountMutation();

  if (!open || !bank) return null;

  const submit = async () => {
    if (!form.bankName || !form.accountName || !form.iban) { setError("يرجى ملء الحقول المطلوبة"); return; }
    setError("");
    try {
      await update({ id: bank.id, ...form, isActive }).unwrap();
      onClose();
    } catch { setError("فشل الحفظ"); }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalOuter title="تعديل حساب بنكي">
        {error && <p className="text-xs text-danger-600 mb-3">{error}</p>}
        <div className="flex items-center justify-between py-2 mb-2">
          <span className="text-sm text-natural-100">تفعيل</span>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
        <div className="space-y-3">
          {(["bankName", "accountName", "accountNumber", "iban", "swiftCode"] as const).map((f) => (
            <div key={f}>
              <label className="text-xs text-portal-note-text block mb-1">
                {{ bankName: "اسم البنك", accountName: "صاحب الحساب", accountNumber: "رقم الحساب", iban: "IBAN", swiftCode: "SWIFT" }[f]}
              </label>
              <input className="w-full rounded-xl border border-portal-card-border p-3 text-sm" value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="text-xs text-portal-note-text block mb-1">تعليمات التحويل</label>
            <textarea className="w-full rounded-xl border border-portal-card-border p-3 text-sm resize-none" rows={2}
              value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={submit} disabled={isLoading}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white bg-secondary-500 hover:bg-secondary-600 disabled:opacity-50"
          >{isLoading ? "..." : "حفظ"}</button>
          <button onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium border border-portal-card-border text-portal-note-text hover:text-natural-100"
          >إلغاء</button>
        </div>
      </ModalOuter>
    </ModalBackdrop>
  );
}

/* ── Page ── */
export default function AdminPaymentGatewaysPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editStripe, setEditStripe] = useState(false);
  const [editBankId, setEditBankId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: gateways, isLoading: gwLoading, isError: gwError } = useGetAdminGatewaysQuery();
  const { data: banks, isLoading: baLoading, isError: baError } = useGetAdminBankAccountsQuery();
  const [updateGw] = useUpdateAdminGatewayMutation();
  const [deleteGw] = useDeleteAdminGatewayMutation();
  const [updateBa] = useUpdateAdminBankAccountMutation();
  const [deleteBa] = useDeleteAdminBankAccountMutation();

  const stripeRow = (gateways ?? []).find((g) => g.name === "stripe");
  const editBank = (banks ?? []).find((b) => b.id === editBankId) ?? null;

  /* Build rows: only stripe gateway + bank accounts. Exclude bank_transfer placeholder. */
  const rows: Array<{
    id: string; label: string; typeLabel: string;
    isActive: boolean; isStripe: boolean;
  }> = [];

  if (stripeRow) {
    rows.push({
      id: stripeRow.id, label: "Stripe",
      typeLabel: "stripe",
      isActive: stripeRow.isActive, isStripe: true,
    });
  }

  for (const ba of banks ?? []) {
    rows.push({
      id: ba.id, label: `${ba.bankName} — ${ba.accountName}`,
      typeLabel: "bank_transfer",
      isActive: ba.isActive, isStripe: false,
    });
  }

  const columns: DataTableColumn[] = [
    { id: "name", label: "طريقة الدفع" },
    { id: "type", label: "النوع", align: "center" },
    { id: "status", label: "الحالة", align: "center" },
    { id: "actions", label: "الإجراءات", align: "left" },
  ];

  return (
    <div className="page-shell" dir="rtl">
      <PageIntro title="بوابات الدفع" description="إدارة بوابات الدفع" icon={CreditCard} />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-natural-100">طرق الدفع</h2>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-600"
        ><Plus className="h-4 w-4" /> إضافة</button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={gwLoading || baLoading}
        isError={gwError || baError}
        emptyState={{ icon: CreditCard, message: "لا توجد طرق دفع", hint: "أضف بوابة دفع أو حساباً بنكياً للبدء." }}
        renderCells={(row) => [
          <td key="name" className="px-5 py-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center",
                row.isActive ? "bg-success-100" : "bg-portal-divider"
              )}>
                <CreditCard className={cn("h-4 w-4", row.isActive ? "text-success-600" : "text-portal-note-text")} />
              </div>
              <p className="text-sm font-medium text-natural-100">{row.label}</p>
            </div>
          </td>,
          <td key="type" className="px-5 py-4 text-center">
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
              {row.typeLabel}
            </span>
          </td>,
          <td key="status" className="px-5 py-4">
            <div className="flex justify-center">
              <Switch checked={row.isActive} onCheckedChange={() => {
                if (row.isStripe) updateGw({ name: "stripe", isActive: !row.isActive });
                else updateBa({ id: row.id, isActive: !row.isActive });
              }} />
            </div>
          </td>,
          <td key="actions" className="px-5 py-4">
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => {
                if (row.isStripe) setEditStripe(true);
                else setEditBankId(row.id);
              }} className="inline-flex items-center gap-1 text-xs text-secondary-500 hover:text-secondary-600 font-medium">
                <Pencil className="h-3.5 w-3.5" /> تعديل
              </button>
              <button onClick={async () => {
                if (deleting === row.id) return;
                setDeleting(row.id);
                try {
                  if (row.isStripe) await deleteGw("stripe").unwrap();
                  else await deleteBa(row.id).unwrap();
                } catch { /* best-effort operation; the UI remains usable without this refresh */ }
                setDeleting(null);
              }} disabled={deleting === row.id}
                className="inline-flex items-center gap-1 text-xs text-danger-500 hover:text-danger-600 font-medium disabled:opacity-50">
                <Trash2 className="h-3.5 w-3.5" /> حذف
              </button>
            </div>
          </td>,
        ]}
      />

      <AddMethodModal open={showAdd} onClose={() => setShowAdd(false)} />
      <EditStripeModal
        open={editStripe}
        stripeGw={stripeRow ? {
          isActive: stripeRow.isActive,
          isConfigured: stripeRow.configJson?.isConfigured ?? false,
          fields: stripeRow.configJson?.fields ?? {},
        } : null}
        onClose={() => setEditStripe(false)}
      />
      <EditBankModal open={!!editBank} bank={editBank} onClose={() => setEditBankId(null)} />
    </div>
  );
}