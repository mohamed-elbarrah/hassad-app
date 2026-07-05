"use client";

import { useState } from "react";
import { Bot, Plus, Pencil, Trash2, Power, Eye } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Dialog } from "@/components/design-system/Dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { toast } from "sonner";

// Note: These would use real API hooks once backend is connected
// For now using mock data pattern
const MOCK_RULES = [
  {
    id: "1",
    name: "إرسال بريد ترحيبي",
    triggerType: "NEW_LEAD",
    isActive: true,
    logCount: 15,
  },
  {
    id: "2",
    name: "تنبيه عند تأهيل عميل",
    triggerType: "LEAD_QUALIFIED",
    isActive: true,
    logCount: 8,
  },
  {
    id: "3",
    name: "إحالة للمبيعات",
    triggerType: "LEAD_HOT",
    isActive: false,
    logCount: 0,
  },
];

export default function AdminAutomationPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    triggerType: "NEW_LEAD",
    conditionJson: "{}",
    actionJson: "{}",
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      triggerType: "NEW_LEAD",
      conditionJson: "{}",
      actionJson: "{}",
    });
    setShowForm(true);
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="قواعد الأتمتة"
        description="إدارة قواعد أتمتة العملاء المحتملين"
        icon={Bot}
        actions={
          <ActionButton size="md" onClick={openCreate}>
            <Plus className="size-4 ml-1" />
            إضافة قاعدة
          </ActionButton>
        }
      />

      <Tabs defaultValue="rules" dir="rtl">
        <TabsList className="w-full justify-start gap-1">
          <TabsTrigger value="rules">القواعد</TabsTrigger>
          <TabsTrigger value="logs">سجل التنفيذ</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4">
          <SurfaceCard>
            <DataTable
              columns={[
                { id: "name", label: "اسم القاعدة" },
                { id: "trigger", label: "المشغل" },
                { id: "status", label: "الحالة" },
                { id: "executions", label: "التنفيذات" },
                { id: "actions", label: "", align: "left" },
              ]}
              data={MOCK_RULES}
              isLoading={false}
              isError={false}
              emptyState={{
                icon: Bot,
                message: "لا توجد قواعد أتمتة",
                hint: "لم يتم إنشاء أي قواعد أتمتة بعد",
              }}
              renderRow={(r: any) => (
                <tr key={r.id} className="border-b border-portal-divider">
                  <td className="px-5 py-3 text-sm font-medium">{r.name}</td>
                  <td className="px-5 py-3 text-sm text-portal-note-text">
                    {r.triggerType}
                  </td>
                  <td className="px-5 py-3">
                    <Pill tone={r.isActive ? "success" : "neutral"}>
                      {r.isActive ? "نشط" : "متوقف"}
                    </Pill>
                  </td>
                  <td className="px-5 py-3 text-sm">{r.logCount}</td>
                  <td className="px-5 py-3 text-left">
                    <div className="flex gap-1 justify-end">
                      <ActionButton variant="ghost" size="sm">
                        <Pencil className="size-4" />
                      </ActionButton>
                      <ActionButton variant="ghost" size="sm">
                        <Power className="size-4" />
                      </ActionButton>
                      <ActionButton variant="ghost" size="sm">
                        <Trash2 className="size-4 text-danger-500" />
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              )}
            />
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <SurfaceCard title="سجل تنفيذ قواعد الأتمتة">
            <p className="text-center text-portal-note-text py-12">
              سجل تنفيذ القواعد قيد التطوير
            </p>
          </SurfaceCard>
        </TabsContent>
      </Tabs>

      <Dialog
        open={showForm}
        onOpenChange={setShowForm}
        title={editing ? "تعديل قاعدة" : "إضافة قاعدة"}
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton variant="outline" onClick={() => setShowForm(false)}>
              إلغاء
            </ActionButton>
            <ActionButton
              onClick={() => {
                toast.success("تم حفظ القاعدة");
                setShowForm(false);
              }}
            >
              حفظ
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-portal-note-text mb-1">
              اسم القاعدة
            </label>
            <FormInputControl
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-portal-note-text mb-1">
              المشغل
            </label>
            <select
              value={form.triggerType}
              onChange={(e) =>
                setForm({ ...form, triggerType: e.target.value })
              }
              className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
            >
              <option value="NEW_LEAD">عميل محتمل جديد</option>
              <option value="LEAD_QUALIFIED">تم تأهيل عميل</option>
              <option value="LEAD_HOT">عميل ساخن</option>
              <option value="LEAD_COLD">عميل بارد</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-portal-note-text mb-1">
              شروط التنفيذ (JSON)
            </label>
            <FormInputControl
              value={form.conditionJson}
              onChange={(e) =>
                setForm({ ...form, conditionJson: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm text-portal-note-text mb-1">
              الإجراءات (JSON)
            </label>
            <FormInputControl
              value={form.actionJson}
              onChange={(e) => setForm({ ...form, actionJson: e.target.value })}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
