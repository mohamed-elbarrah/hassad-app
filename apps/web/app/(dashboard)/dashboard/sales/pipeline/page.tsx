import { Kanban } from "lucide-react";
import { KanbanBoard } from "@/components/dashboard/crm/KanbanBoard";
import { PageIntro } from "@/components/design-system/PageIntro";
import { ActionButton } from "@/components/design-system/ActionButton";

export default function PipelinePage() {
  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="لوحة خط المبيعات"
        description="تتبّع حالة الطلبات من الاستقبال حتى التحويل إلى مشروع. اسحب البطاقات بين الأعمدة لتحديث الحالة."
        icon={Kanban}
        actions={
          <>
            <ActionButton
              variant="outline"
              size="md"
              href="/dashboard/sales/proposals"
            >
              العروض الفنية
            </ActionButton>
            <ActionButton
              variant="outline"
              size="md"
              href="/dashboard/sales/contracts"
            >
              العقود
            </ActionButton>
          </>
        }
      />

      <KanbanBoard />
    </div>
  );
}
