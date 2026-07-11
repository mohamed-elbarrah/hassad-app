"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, TrendingUp, UserPlus, Phone, Mail, Handshake, MessageSquare, PlusCircle, FileText } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { Dialog } from "@/components/design-system/Dialog";
import { DataTable } from "@/components/design-system/DataTable";
import {
  useGetAdminLeadQuery,
  useConvertLeadToClientMutation,
  useAddContactLogMutation,
} from "@/features/admin/adminApi";
import { LEAD_STAGE_AR } from "@hassad/shared";
import { toast } from "sonner";
import { Select, SelectItem } from "@/components/design-system/Select";
import { FormInputControl } from "@/components/design-system/FormInputControl";

const CONTACT_TYPE_ICONS: Record<string, React.ReactNode> = {
  CALL: <Phone className="size-4" />,
  EMAIL: <Mail className="size-4" />,
  MEETING: <Handshake className="size-4" />,
  WHATSAPP: <MessageSquare className="size-4" />,
};

const CONTACT_TYPE_AR: Record<string, string> = {
  CALL: "اتصال",
  EMAIL: "بريد",
  MEETING: "اجتماع",
  WHATSAPP: "واتساب",
};

const CONTACT_RESULT_AR: Record<string, string> = {
  NO_RESPONSE: "لا رد",
  RESPONDED: "تم الرد",
  BUSY: "مشغول",
  WRONG_NUMBER: "رقم خاطئ",
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
  return `منذ ${Math.floor(days / 30)} أشهر`;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString()} ر.س`;
}

export default function AdminLeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: lead, isLoading } = useGetAdminLeadQuery(id);
  const [convertToClient, { isLoading: isConverting }] = useConvertLeadToClientMutation();
  const [addContactLog, { isLoading: isAddingContact }] = useAddContactLogMutation();
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [convertNotes, setConvertNotes] = useState("");
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactForm, setContactForm] = useState({
    type: "CALL",
    result: "RESPONDED",
    notes: "",
    contactedAt: new Date().toISOString().slice(0, 16),
  });

  const handleAddContact = async () => {
    try {
      await addContactLog({
        id,
        ...contactForm,
        contactedAt: new Date(contactForm.contactedAt).toISOString(),
      }).unwrap();
      toast.success("تم إضافة سجل التواصل");
      setShowContactDialog(false);
      setContactForm({ type: "CALL", result: "RESPONDED", notes: "", contactedAt: new Date().toISOString().slice(0, 16) });
    } catch {
      toast.error("فشل إضافة سجل التواصل");
    }
  };

  if (isLoading)
    return (
      <div className="flex flex-col gap-6 p-6" dir="rtl">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  if (!lead)
    return (
      <div className="p-6 text-center text-portal-note-text" dir="rtl">
        العميل المحتمل غير موجود
      </div>
    );

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title={lead.companyName}
        description={lead.contactName}
        icon={TrendingUp}
        actions={
          <div className="flex gap-2">
            {!lead.client && (
              <ActionButton
                variant="action-purple"
                size="md"
                onClick={() => setShowConvertDialog(true)}
                disabled={isConverting}
                loading={isConverting}
              >
                <UserPlus className="size-4 ml-1" />
                تحويل إلى عميل
              </ActionButton>
            )}
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
            <TabsTrigger value="contact">سجل التواصل</TabsTrigger>
            <TabsTrigger value="pipeline">سجل المراحل</TabsTrigger>
            <TabsTrigger value="services">الخدمات</TabsTrigger>
            <TabsTrigger value="automation">سجل الأتمتة</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">اسم الشركة</span>
                    <p className="text-base font-medium">{lead.companyName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">جهة الاتصال</span>
                    <p className="text-base font-medium">{lead.contactName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">البريد</span>
                    <p className="text-base font-medium">{lead.email ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">الهاتف</span>
                    <p className="text-base font-medium">{lead.phoneWhatsapp ?? "—"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">المسؤول</span>
                    <p className="text-base font-medium">{lead.assignee?.name ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">المرحلة</span>
                    <Pill tone="blue">
                      {LEAD_STAGE_AR[lead.pipelineStage] ?? lead.pipelineStage}
                    </Pill>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">المصدر</span>
                    <p className="text-base font-medium">{lead.source ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">نوع النشاط</span>
                    <p className="text-base font-medium">{lead.businessType ?? "—"}</p>
                  </div>
                </div>
              </div>
              {lead.proposals && lead.proposals.length > 0 && (
                <div className="mt-6 border-t border-portal-divider pt-6">
                  <h4 className="text-sm font-semibold text-natural-100 mb-3">العروض المربوطة</h4>
                  <div className="space-y-3">
                    {lead.proposals.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => router.push(`/dashboard/admin/proposals/${p.id}`)}
                        className="flex items-center justify-between rounded-xl border border-portal-divider p-4 cursor-pointer hover:bg-badge-gray-bg/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="size-5 text-secondary-500" />
                          <div>
                            <p className="text-sm font-medium text-natural-100">{p.title}</p>
                            <p className="text-xs text-portal-note-text">{p.status}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-secondary-600">
                          {formatCurrency(p.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="contact">
              <div className="flex justify-end mb-4">
                <ActionButton
                  variant="action-purple"
                  size="sm"
                  onClick={() => setShowContactDialog(true)}
                >
                  <PlusCircle className="size-4 ml-1" />
                  إضافة تواصل
                </ActionButton>
              </div>
              <DataTable
                columns={[
                  { id: "type", label: "النوع" },
                  { id: "result", label: "النتيجة" },
                  { id: "notes", label: "ملاحظات" },
                  { id: "date", label: "التاريخ", align: "left" },
                ]}
                data={lead.contactLogs ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: TrendingUp,
                  message: "لا توجد سجلات تواصل",
                  hint: "لم يتم تسجيل أي تواصل مع هذا العميل المحتمل",
                }}
                renderRow={(c: any) => (
                  <tr key={c.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">
                      <span className="flex items-center gap-2">
                        {CONTACT_TYPE_ICONS[c.type] ?? null}
                        {CONTACT_TYPE_AR[c.type] ?? c.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm">{CONTACT_RESULT_AR[c.result] ?? c.result}</td>
                    <td className="px-5 py-3 text-sm text-portal-note-text">{c.notes ?? "—"}</td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left whitespace-nowrap">
                      <span dir="ltr">{c.contactedAt?.slice(0, 10) ?? "—"}</span>
                      <span className="text-portal-note-text mr-2">{relativeTime(c.contactedAt)}</span>
                    </td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="pipeline">
              <DataTable
                columns={[
                  { id: "from", label: "من" },
                  { id: "to", label: "إلى" },
                  { id: "by", label: "بواسطة" },
                  { id: "date", label: "التاريخ", align: "left" },
                ]}
                data={lead.pipelineHistory ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: TrendingUp,
                  message: "لا يوجد سجل مراحل",
                  hint: "لم يتم تسجيل تغييرات في المراحل",
                }}
                renderRow={(h: any) => (
                  <tr key={h.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm">
                      <Pill tone="neutral">{h.fromStage}</Pill>
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <Pill tone="blue">{h.toStage}</Pill>
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text">{h.changedBy ?? "—"}</td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">{h.changedAt?.slice(0, 10) ?? "—"}</td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="services">
              <DataTable
                columns={[
                  { id: "service", label: "الخدمة" },
                  { id: "qty", label: "الكمية" },
                  { id: "price", label: "السعر" },
                ]}
                data={lead.services ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: TrendingUp,
                  message: "لا توجد خدمات",
                  hint: "لم يتم إضافة خدمات لهذا العميل المحتمل",
                }}
                renderRow={(s: any) => (
                  <tr key={s.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">{s.service?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-sm">{s.quantity ?? 1}</td>
                    <td className="px-5 py-3 text-sm">{s.price ?? "—"}</td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="automation">
              <DataTable
                columns={[
                  { id: "rule", label: "القاعدة" },
                  { id: "status", label: "الحالة" },
                  { id: "date", label: "التاريخ", align: "left" },
                ]}
                data={lead.automationLogs ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: TrendingUp,
                  message: "لا توجد سجلات أتمتة",
                  hint: "لم يتم تشغيل أي قواعد أتمتة لهذا العميل المحتمل",
                }}
                renderRow={(a: any) => (
                  <tr key={a.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">{a.ruleId}</td>
                    <td className="px-5 py-3 text-sm">
                      <Pill tone={a.status === "SUCCESS" ? "success" : "danger"}>{a.status}</Pill>
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">{a.executedAt?.slice(0, 10) ?? "—"}</td>
                  </tr>
                )}
              />
            </TabsContent>
          </div>
        </Tabs>
      </SurfaceCard>

      <Dialog
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
        icon={UserPlus}
        title="تحويل إلى عميل"
        description={`هل أنت متأكد من تحويل "${lead.companyName}" إلى عميل؟`}
        footer={
          <>
            <ActionButton variant="outline" size="md" onClick={() => setShowConvertDialog(false)} disabled={isConverting}>
              إلغاء
            </ActionButton>
            <ActionButton variant="action-purple" size="md" onClick={async () => {
              try {
                await convertToClient({ id, additionalNotes: convertNotes || undefined }).unwrap();
                toast.success("تم تحويل العميل المحتمل إلى عميل بنجاح");
                setShowConvertDialog(false);
                router.push(`/dashboard/admin/clients/${id}`);
              } catch {
                toast.error("حدث خطأ أثناء تحويل العميل المحتمل");
              }
            }} disabled={isConverting} loading={isConverting}>
              تأكيد التحويل
            </ActionButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-portal-note-text">اسم الشركة</span><p className="font-medium">{lead.companyName}</p></div>
            <div><span className="text-portal-note-text">جهة الاتصال</span><p className="font-medium">{lead.contactName}</p></div>
            <div><span className="text-portal-note-text">البريد</span><p className="font-medium">{lead.email ?? "—"}</p></div>
            <div><span className="text-portal-note-text">الهاتف</span><p className="font-medium">{lead.phoneWhatsapp ?? "—"}</p></div>
          </div>
          <div>
            <label className="block text-sm text-portal-note-text mb-1">ملاحظات إضافية</label>
            <textarea
              className="w-full rounded-xl border border-portal-card-border bg-natural-0 px-3 py-2 text-sm outline-none focus:border-secondary-500 resize-none"
              rows={3} value={convertNotes}
              onChange={(e) => setConvertNotes(e.target.value)}
              placeholder="اختياري..."
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={showContactDialog}
        onOpenChange={setShowContactDialog}
        title="إضافة سجل تواصل"
        footer={
          <>
            <ActionButton variant="outline" size="md" onClick={() => setShowContactDialog(false)} disabled={isAddingContact}>
              إلغاء
            </ActionButton>
            <ActionButton size="md" onClick={handleAddContact} disabled={isAddingContact} loading={isAddingContact}>
              حفظ
            </ActionButton>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="نوع التواصل"
            value={contactForm.type}
            onValueChange={(v) => setContactForm((f) => ({ ...f, type: v }))}
          >
            <SelectItem value="CALL">اتصال</SelectItem>
            <SelectItem value="EMAIL">بريد</SelectItem>
            <SelectItem value="MEETING">اجتماع</SelectItem>
            <SelectItem value="WHATSAPP">واتساب</SelectItem>
          </Select>
          <Select
            label="النتيجة"
            value={contactForm.result}
            onValueChange={(v) => setContactForm((f) => ({ ...f, result: v }))}
          >
            <SelectItem value="RESPONDED">تم الرد</SelectItem>
            <SelectItem value="NO_RESPONSE">لا رد</SelectItem>
            <SelectItem value="BUSY">مشغول</SelectItem>
            <SelectItem value="WRONG_NUMBER">رقم خاطئ</SelectItem>
          </Select>
          <div>
            <label className="block text-sm text-portal-note-text mb-1">التاريخ والوقت</label>
            <FormInputControl
              type="datetime-local"
              value={contactForm.contactedAt}
              onChange={(e) => setContactForm((f) => ({ ...f, contactedAt: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm text-portal-note-text mb-1">ملاحظات</label>
            <textarea
              className="w-full rounded-xl border border-portal-card-border bg-natural-0 px-3 py-2 text-sm outline-none focus:border-secondary-500 resize-none"
              rows={3}
              value={contactForm.notes}
              onChange={(e) => setContactForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="أي ملاحظات..."
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
