"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Globe, Users, Clock, FileText, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { ActionButton } from "@/components/design-system/ActionButton";
import { PageIntro } from "@/components/design-system/PageIntro";
import { StatCard } from "@/components/design-system/StatCard";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pill } from "@/components/design-system/Pill";
import { Dialog } from "@/components/design-system/Dialog";
import { toast } from "sonner";
import { useGetPortalOverviewQuery, useGetPortalClientsQuery, useRegeneratePortalTokenMutation, type PortalClientRow } from "@/features/admin/adminApi";

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

export default function AdminPortalPage() {
  const [searchInput, setSearchInput] = useState("");
  const [tokenClient, setTokenClient] = useState<PortalClientRow | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchInput, 400);
  const { data: overview } = useGetPortalOverviewQuery();
  const { data: clientsData, isLoading } = useGetPortalClientsQuery({ search: debouncedSearch || undefined });
  const [regenerateToken] = useRegeneratePortalTokenMutation();

  const clients = clientsData?.items ?? [];

  const handleRegenerateToken = async () => {
    if (!tokenClient) return;
    try {
      const res = await regenerateToken(tokenClient.id).unwrap();
      setNewToken(res.token);
      toast.success("تم إعادة إنشاء رمز البوابة");
    } catch { toast.error("فشل"); }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro title="بوابة العملاء" description="نظرة عامة على نشاط العملاء في البوابة" icon={Globe} />

      {/* Overview stats */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="العملاء النشطين" value={overview.activeClients} icon={Users} trend="up" trendValue={`${overview.idleClients} خامل`} />
          <StatCard title="بانتظار الموافقة" value={overview.pendingApprovals} icon={Clock} variant={overview.pendingApprovals > 0 ? "warning" : "default"} />
          <StatCard title="طلبات المراجعة" value={overview.pendingRevisions} icon={FileText} variant={overview.pendingRevisions > 0 ? "warning" : "default"} />
          <StatCard title="نماذج غير مكتملة" value={overview.unsubmittedIntakeForms} icon={AlertTriangle} variant={overview.unsubmittedIntakeForms > 0 ? "warning" : "default"} />
        </div>
      )}

      {/* Client list */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
        <FormInputControl placeholder="ابحث عن عميل..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pr-9" />
      </div>

      <DataTable
        columns={[
          { id: "company", label: "الشركة" }, { id: "contact", label: "جهة الاتصال" },
          { id: "status", label: "الحالة" }, { id: "portal", label: "البوابة" },
          { id: "lastLogin", label: "آخر دخول", align: "left" }, { id: "intake", label: "النموذج" },
          { id: "pending", label: "بانتظار الموافقة" }, { id: "actions", label: "الإجراءات", width: "100px" },
        ]}
        data={clients} isLoading={isLoading} isError={false}
        emptyState={{ icon: Globe, message: "لا توجد عملاء", hint: "لم يتم إضافة أي عملاء بعد" }}
        renderRow={(c: PortalClientRow) => (
          <tr key={c.id} className="border-b border-portal-divider">
            <td className="px-5 py-4 text-base font-medium text-natural-100">{c.companyName}</td>
            <td className="px-5 py-4 text-sm text-portal-note-text">{c.contactName}</td>
            <td className="px-5 py-4"><StatusBadge status={c.status} label={c.status} /></td>
            <td className="px-5 py-4">{c.hasPortalAccess ? <Pill tone="success">مفعلة</Pill> : <Pill tone="neutral">غير مفعلة</Pill>}</td>
            <td className="px-5 py-4 text-sm text-portal-note-text text-left" dir="ltr">{c.lastLoginAt?.slice(0, 10) ?? "—"}</td>
            <td className="px-5 py-4">{c.intakeCompleted ? <CheckCircle className="size-4 text-success-500" /> : <Clock className="size-4 text-warning-500" />}</td>
            <td className="px-5 py-4">{c.pendingApprovalsCount > 0 ? <Pill tone="warning">{c.pendingApprovalsCount}</Pill> : <span className="text-sm text-portal-note-text">0</span>}</td>
            <td className="px-5 py-4">
              <ActionButton variant="ghost" size="sm" className="h-8 w-8" title="إعادة إنشاء رمز البوابة" onClick={() => { setTokenClient(c); setNewToken(null); }}>
                <RefreshCw className="size-3.5" />
              </ActionButton>
            </td>
          </tr>
        )}
      />

      <Dialog open={!!tokenClient} onOpenChange={(o) => { if (!o) { setTokenClient(null); setNewToken(null); }}}
        title="إعادة إنشاء رمز البوابة"
        description={newToken ? "تم إنشاء الرمز الجديد. يمكنك نسخه الآن." : `سيتم إنشاء رمز جديد للعميل ${tokenClient?.companyName}. الرمز القديم سينتهي فوراً.`}
        footer={<div className="flex gap-2 justify-end">
          <ActionButton variant="outline" onClick={() => { setTokenClient(null); setNewToken(null); }}>إغلاق</ActionButton>
          {!newToken && <ActionButton onClick={handleRegenerateToken}>تأكيد</ActionButton>}
        </div>}>
        {newToken && (
          <div className="space-y-2">
            <p className="text-sm font-medium">رمز البوابة الجديد</p>
            <div className="rounded-xl border border-portal-divider bg-badge-gray-bg p-3 font-mono text-sm break-all" dir="ltr">{newToken}</div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
