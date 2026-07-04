"use client";

import { useState } from "react";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Dialog } from "@/components/design-system/Dialog";
import { toast } from "sonner";
import {
  useGetBankAccountsQuery,
  useCreateBankAccountMutation,
  useUpdateBankAccountMutation,
  useDeleteBankAccountMutation,
} from "@/features/finance/financeApi";

export default function AdminBankAccountsPage() {
  const { data: accounts, isLoading } = useGetBankAccountsQuery();
  const [createAccount] = useCreateBankAccountMutation();
  const [updateAccount] = useUpdateBankAccountMutation();
  const [deleteAccount] = useDeleteBankAccountMutation();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ bankName: "", accountNumber: "", accountName: "", iban: "", isActive: true });

  const openCreate = () => { setEditing(null); setForm({ bankName: "", accountNumber: "", accountName: "", iban: "", isActive: true }); setShowForm(true); };
  const openEdit = (a: any) => { setEditing(a); setForm({ bankName: a.bankName, accountNumber: a.accountNumber, accountName: a.accountName, iban: a.iban ?? "", isActive: a.isActive }); setShowForm(true); };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro title="الحسابات البنكية" description="إدارة الحسابات البنكية للمنصة" icon={Building2}
        actions={<ActionButton size="md" onClick={openCreate}><Plus className="size-4 ml-1" />إضافة حساب</ActionButton>} />

      <SurfaceCard>
        <DataTable
          columns={[
            { id: "bankName", label: "اسم البنك" },
            { id: "accountName", label: "اسم الحساب" },
            { id: "accountNumber", label: "رقم الحساب" },
            { id: "iban", label: "IBAN" },
            { id: "status", label: "الحالة" },
            { id: "actions", label: "", align: "left" },
          ]}
          data={accounts ?? []} isLoading={isLoading} isError={false}
          emptyState={{ icon: Building2, message: "لا توجد حسابات بنكية", hint: "لم يتم إضافة حسابات بنكية بعد" }}
          renderRow={(a: any) => (
            <tr key={a.id} className="border-b border-portal-divider">
              <td className="px-5 py-3 text-sm font-medium">{a.bankName}</td>
              <td className="px-5 py-3 text-sm">{a.accountName}</td>
              <td className="px-5 py-3 text-sm text-portal-note-text" dir="ltr">{a.accountNumber}</td>
              <td className="px-5 py-3 text-sm text-portal-note-text" dir="ltr">{a.iban ?? "—"}</td>
              <td className="px-5 py-3"><Pill tone={a.isActive ? "success" : "neutral"}>{a.isActive ? "نشط" : "غير نشط"}</Pill></td>
              <td className="px-5 py-3 text-left">
                <div className="flex gap-1 justify-end">
                  <ActionButton variant="ghost" size="sm" onClick={() => openEdit(a)}><Pencil className="size-4" /></ActionButton>
                  <ActionButton variant="ghost" size="sm" onClick={async () => {
                    if (confirm("هل أنت متأكد من حذف هذا الحساب البنكي؟")) {
                      try { await deleteAccount(a.id).unwrap(); toast.success("تم حذف الحساب"); } catch { toast.error("فشل الحذف"); }
                    }
                  }}><Trash2 className="size-4 text-danger-500" /></ActionButton>
                </div>
              </td>
            </tr>
          )}
        />
      </SurfaceCard>

      <Dialog open={showForm} onOpenChange={setShowForm} title={editing ? "تعديل حساب بنكي" : "إضافة حساب بنكي"}
        footer={<div className="flex gap-2 justify-end">
          <ActionButton variant="outline" onClick={() => setShowForm(false)}>إلغاء</ActionButton>
          <ActionButton onClick={async () => {
            try {
              if (editing) {
                await updateAccount({ id: editing.id, body: form }).unwrap();
                toast.success("تم تحديث الحساب");
              } else {
                await createAccount(form).unwrap();
                toast.success("تم إنشاء الحساب");
              }
              setShowForm(false);
            } catch { toast.error("فشل"); }
          }}>{editing ? "تحديث" : "إنشاء"}</ActionButton>
        </div>}>
        <div className="space-y-4">
          <FormInputControl label="اسم البنك" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
          <FormInputControl label="اسم الحساب" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} />
          <FormInputControl label="رقم الحساب" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
          <FormInputControl label="IBAN" value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-portal-divider" />
            <span className="text-sm">نشط</span>
          </label>
        </div>
      </Dialog>
    </div>
  );
}
