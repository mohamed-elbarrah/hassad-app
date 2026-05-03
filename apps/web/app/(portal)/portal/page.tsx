"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Settings,
  TrendingUp,
  Users,
  Filter,
  DollarSign,
  Palette,
  FileText,
  Clock,
  Activity,
  Receipt,
} from "lucide-react";

import { useAppSelector } from "@/lib/hooks";
import { useGetDeliverablesByClientQuery } from "@/features/deliverables/deliverablesApi";
import { useGetInvoicesByClientQuery } from "@/features/finance/financeApi";

import { DashboardCard } from "@/components/portal/DashboardCard";
import { GaugeChart } from "@/components/portal/GaugeChart";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { ActionItemCard } from "@/components/portal/ActionItemCard";
import { KpiRow } from "@/components/portal/KpiRow";
import { TimelineItem } from "@/components/portal/TimelineItem";
import { DeliverableItem } from "@/components/portal/DeliverableItem";
import { PmCard } from "@/components/portal/PmCard";
import { IntakeFormModal } from "@/components/dashboard/crm/IntakeFormModal";

export default function PortalPage() {
  const [showNewDeal, setShowNewDeal] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const clientId = user?.clientId ?? "";

  // ── API hooks (linked to backend when ready) ─────────────────────────
  const { data: deliverables } = useGetDeliverablesByClientQuery(clientId, {
    skip: !clientId,
  });
  const { data: invoices } = useGetInvoicesByClientQuery(clientId, {
    skip: !clientId,
  });

  // Calculate gauge value from real deliverables if available
  const totalDeliverables = deliverables?.length ?? 0;
  const doneDeliverables = deliverables?.filter((d) => d.status === "DONE").length ?? 0;
  const gaugeValue =
    totalDeliverables > 0
      ? Math.round((doneDeliverables / totalDeliverables) * 100)
      : 70; // default demo value

  if (!clientId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p style={{ fontSize: 18, color: "rgba(0,0,0,0.6)" }}>
          لم يتم ربط حسابك بملف عميل. يرجى التواصل مع الإدارة.
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5"
      dir="rtl"
      style={{
        maxWidth: "100%",
        margin: "0 auto",
      }}
    >
      {/* ═══════════════════════════════════════════
          COLUMN 1 (RIGHT in RTL = original RIGHT side)
          تقدم المشروع + آخر التحديثات
         ═══════════════════════════════════════════ */}
      <div className="flex flex-col gap-5">
        {/* ── تقدم المشروع ──────────────────────────── */}
        <DashboardCard
          title="تقدم المشروع"
          icon={Activity}
          onShowAll={() => router.push("/portal/deliverables")}
        >
          <div className="flex flex-col items-center gap-5">
            <GaugeChart value={gaugeValue} max={100} />

            <div className="w-full space-y-3">
              {/* الهوية البصرية - مكتمل */}
              <div
                className="flex items-center justify-between p-4 bg-white"
                style={{ border: "1px solid #E1E4EA", borderRadius: 12 }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    lineHeight: "33px",
                    color: "#000000",
                  }}
                >
                  الهوية البصرية
                </span>
                <StatusBadge status="completed" />
              </div>

              {/* صفحة الهبوط - جاري */}
              <div
                className="flex items-center justify-between p-4 bg-white"
                style={{ border: "1px solid #E1E4EA", borderRadius: 12 }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    lineHeight: "33px",
                    color: "#000000",
                  }}
                >
                  صفحة الهبوط
                </span>
                <StatusBadge status="in-progress" />
              </div>

              {/* الحملة الاعلانية - لم يبدأ */}
              <div
                className="flex items-center justify-between p-4 bg-white"
                style={{ border: "1px solid #E1E4EA", borderRadius: 12 }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    lineHeight: "33px",
                    color: "#000000",
                  }}
                >
                  الحملة الاعلانية
                </span>
                <StatusBadge status="not-started" />
              </div>

              {/* المرحلة الحالية note */}
              <div
                className="p-5 text-right"
                style={{
                  background: "#F9FAFB",
                  borderRadius: 12,
                }}
              >
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    lineHeight: "33px",
                    color: "#000000",
                  }}
                >
                  المرحلة الحالية :
                </p>
                <p
                  className="mt-1"
                  style={{
                    fontSize: 18,
                    fontWeight: 400,
                    lineHeight: "27px",
                    color: "rgba(0, 0, 0, 0.6)",
                  }}
                >
                  تنفيذ الحملة الإعلانية على الإنستغرام و تيكتوك
                </p>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* ── آخر التحديثات ─────────────────────────── */}
        <DashboardCard
          title="آخر التحديثات"
          icon={Clock}
          onShowAll={() => {}}
        >
          <div className="space-y-3">
            <TimelineItem
              date="اليوم - 24 افريل 2026"
              text="تم رفع تصميم إعلان جديد"
              icon={
                <Palette
                  style={{ width: 26, height: 26, color: "#121936" }}
                />
              }
            />
            <TimelineItem
              date="أمس - 23 افريل 2026"
              text="تم إرسال تقرير الحملة"
              icon={
                <FileText
                  style={{ width: 20, height: 23, color: "#121936" }}
                />
              }
            />
            <TimelineItem
              date="قبل 3 أيام - 20 افريل 2026"
              text="تم إطلاق حملة Google Ads"
              icon={
                <TrendingUp
                  style={{ width: 24, height: 24, color: "#121936" }}
                />
              }
            />
          </div>
        </DashboardCard>
      </div>

      {/* ═══════════════════════════════════════════
          COLUMN 2 (MIDDLE)
          إجراءات تحتاج تدخلك + أداء الحملة
         ═══════════════════════════════════════════ */}
      <div className="flex flex-col gap-5">
        {/* ── إجراءات تحتاج تدخلك ─────────────────── */}
        <DashboardCard
          title="إجراءات تحتاج تدخلك"
          icon={Settings}
          onShowAll={() => router.push("/portal/deliverables")}
        >
          <div className="space-y-3">
            <ActionItemCard
              title="موافقة على تصميم إعلان"
              subtitle="تم رفع 3 تصاميم جديدة"
              icon={
                <Palette
                  style={{ width: 26, height: 26, color: "#121936" }}
                />
              }
              secondaryAction="ذكرني لاحقًا"
              primaryAction="مراجعة الآن"
              primaryColor="purple"
              onPrimary={() => router.push("/portal/deliverables")}
            />
            <ActionItemCard
              title="فاتورة مستحقة"
              subtitle="هذه الفاتوة تستحق خلال 3 أيام"
              icon={
                <Receipt
                  style={{ width: 20, height: 23, color: "#121936" }}
                />
              }
              secondaryAction="ذكرني لاحقًا"
              primaryAction="أدفع الان"
              primaryColor="blue"
              onPrimary={() => router.push("/portal/finance")}
            />
          </div>
        </DashboardCard>

        {/* ── أداء الحملة ───────────────────────────── */}
        <DashboardCard
          title="أداء الحملة"
          icon={TrendingUp}
          onShowAll={() => router.push("/portal/reports")}
        >
          <div className="space-y-3">
            <KpiRow
              label="الزيارات"
              value="12,450 زيارة"
              icon={
                <Users
                  style={{ width: 29, height: 22, color: "#121936" }}
                />
              }
            />
            <KpiRow
              label="التحويلات"
              value="320 تحويل"
              icon={
                <Filter
                  style={{ width: 23, height: 23, color: "#121936" }}
                />
              }
            />
            <KpiRow
              label="العائد على الإنفاق الإعلاني"
              value="2.8x"
              icon={
                <DollarSign
                  style={{ width: 28, height: 28, color: "#121936" }}
                />
              }
            />
            <KpiRow
              label="العائد على الإنفاق الإعلاني"
              value="2.8x"
              icon={
                <DollarSign
                  style={{ width: 28, height: 28, color: "#121936" }}
                />
              }
            />

            {/* Green note banner */}
            <div
              className="p-5 text-right"
              style={{
                background: "rgba(74, 233, 152, 0.15)",
                borderRadius: 12,
              }}
            >
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  lineHeight: "33px",
                  color: "#000000",
                }}
              >
                ملاحظة:
              </p>
              <p
                className="mt-1"
                style={{
                  fontSize: 18,
                  fontWeight: 400,
                  lineHeight: "27px",
                  color: "rgba(0, 0, 0, 0.6)",
                }}
              >
                الأداء تحسن بنسبة 18% مقارنة بالأسبوع الماضي
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* ═══════════════════════════════════════════
          COLUMN 3 (LEFT in RTL = original LEFT side)
          ملخص سريع + مدير المشروع
         ═══════════════════════════════════════════ */}
      <div className="flex flex-col gap-5">
        {/* ── ملخص سريع ────────────────────────────── */}
        <DashboardCard
          title="ملخص سريع"
          icon={ClipboardList}
          onShowAll={() => router.push("/portal/deliverables")}
        >
          <div className="space-y-3">
            <DeliverableItem
              title="تصميم صفحة الهبوط"
              description="هذا النص هو مثال لنص يمكن استبداله"
              date="18 افريل"
              status="completed"
              statusLabel="تم التسليم"
            />
            <DeliverableItem
              title="إعلانات الفايسبوك"
              description="هذا النص هو مثال لنص يمكن استبداله"
              date="CTR 3.2%"
              status="in-progress"
              statusLabel="نشط"
            />
            <DeliverableItem
              title="الفاتورة القادمة : 1,200 رس"
              description="هذا النص هو مثال لنص يمكن استبداله"
              date="25 أبريل"
              status="pending"
              statusLabel="قادمة"
            />
            <DeliverableItem
              title="تسليم فيديو إعلاني"
              description="هذا النص هو مثال لنص يمكن استبداله"
              date="28 أبريل"
              status="pending"
              statusLabel="قادمة"
            />
          </div>
        </DashboardCard>

        {/* ── مدير المشروع ──────────────────────────── */}
        <DashboardCard
          title="مدير المشروع"
          icon={ClipboardList}
          showAll={false}
        >
          <PmCard
            name="أحمد المحمد"
            role="مدير المشروع المسؤول"
            status="online"
          />
        </DashboardCard>
      </div>

      {/* New service request modal */}
      {showNewDeal && (
        <IntakeFormModal
          mandatory={false}
          onSuccess={() => setShowNewDeal(false)}
          onClose={() => setShowNewDeal(false)}
        />
      )}
    </div>
  );
}
