"use client";


import {
  BarChart3,
  DollarSign,
  FolderKanban,
  Smile,
  TrendingUp,
  Users,
  CreditCard,
  Clock,
  AlertTriangle,
  Star,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { MetricCard } from "@/components/design-system/MetricCard";
import { Skeleton } from "@/components/design-system/Skeleton";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import {
  useGetAdminReportSalesQuery,
  useGetAdminReportRevenueQuery,
  useGetAdminReportProjectsQuery,
  useGetAdminReportSatisfactionQuery,
} from "@/features/admin/adminReportsApi";

function formatSAR(value: number) {
  return value.toLocaleString("ar-SA") + " ر.س";
}

function SalesSection() {
  const { data, isLoading, isError } = useGetAdminReportSalesQuery();

  if (isLoading) {
    return (
      <SurfaceCard title="المبيعات" icon={BarChart3}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-28 rounded-[30px]" />
            <Skeleton className="h-28 rounded-[30px]" />
          </div>
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </SurfaceCard>
    );
  }

  if (isError || !data) {
    return (
      <SurfaceCard title="المبيعات" icon={BarChart3}>
        <AdminEmptyState
          icon={BarChart3}
          title="تعذر تحميل تقرير المبيعات"
          description="حدث خطأ أثناء جلب البيانات. يرجى المحاولة لاحقاً."
        />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard title="المبيعات" icon={BarChart3}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard
            title="إجمالي العملاء المتوقعين"
            value={data.totalLeads}
            icon={Users}
          />
          <MetricCard
            title="معدل التحويل"
            value={"٪" + data.conversionRate}
            icon={TrendingUp}
            variant={data.conversionRate > 30 ? "success" : "warning"}
          />
        </div>

        {data.leadsByStage.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-portal-note-text mb-3">
              العملاء المتوقعون حسب المرحلة
            </h3>
            <div className="space-y-2">
              {data.leadsByStage.map((item) => (
                <div
                  key={item.stage}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-2.5"
                >
                  <span className="text-sm text-natural-100">{item.stage}</span>
                  <span className="text-sm font-semibold text-natural-100">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.topSalesPeople.filter((p) => p.name).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-portal-note-text mb-3">
              أفضل مندوبي المبيعات
            </h3>
            <div className="space-y-2">
              {data.topSalesPeople
                .filter((p) => p.name)
                .map((person) => (
                  <div
                    key={person.userId}
                    className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-natural-100">
                        {person.name}
                      </p>
                      <p className="text-xs text-portal-note-text">
                        {person.email}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-natural-100">
                      {person.count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

function RevenueSection() {
  const { data, isLoading, isError } = useGetAdminReportRevenueQuery();

  if (isLoading) {
    return (
      <SurfaceCard title="الإيرادات" icon={DollarSign}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-28 rounded-[30px]" />
            <Skeleton className="h-28 rounded-[30px]" />
          </div>
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </SurfaceCard>
    );
  }

  if (isError || !data) {
    return (
      <SurfaceCard title="الإيرادات" icon={DollarSign}>
        <AdminEmptyState
          icon={DollarSign}
          title="تعذر تحميل تقرير الإيرادات"
          description="حدث خطأ أثناء جلب البيانات. يرجى المحاولة لاحقاً."
        />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard title="الإيرادات" icon={DollarSign}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard
            title="متوسط قيمة الفاتورة"
            value={formatSAR(data.avgInvoiceValue)}
            icon={CreditCard}
          />
          <MetricCard
            title="المدفوع"
            value={data.paidVsUnpaid.paid.count + " فاتورة"}
            icon={DollarSign}
            variant="success"
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-portal-note-text mb-3">
            المدفوع مقابل غير المدفوع
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-success-100/30 border border-success-200 p-4">
              <p className="text-xs text-success-700">مدفوع</p>
              <p className="text-lg font-semibold text-success-700 mt-1">
                {data.paidVsUnpaid.paid.count} فاتورة
              </p>
              <p className="text-sm text-success-600">
                {formatSAR(data.paidVsUnpaid.paid.total)}
              </p>
            </div>
            <div className="rounded-xl bg-alert-100/30 border border-alert-200 p-4">
              <p className="text-xs text-alert-700">غير مدفوع</p>
              <p className="text-lg font-semibold text-alert-700 mt-1">
                {data.paidVsUnpaid.unpaid.count} فاتورة
              </p>
              <p className="text-sm text-alert-600">
                {formatSAR(data.paidVsUnpaid.unpaid.total)}
              </p>
            </div>
          </div>
        </div>

        {data.monthlyRevenue.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-portal-note-text mb-3">
              الإيرادات الشهرية
            </h3>
            <div className="space-y-2">
              {data.monthlyRevenue.map((item) => (
                <div
                  key={item.month}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-2.5"
                >
                  <span className="text-sm text-natural-100">{item.month}</span>
                  <span className="text-sm font-semibold text-natural-100">
                    {formatSAR(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.topClients.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-portal-note-text mb-3">
              أفضل العملاء
            </h3>
            <div className="space-y-2">
              {data.topClients.map((client) => (
                <div
                  key={client.clientId}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-natural-100">
                      {client.companyName || "—"}
                    </p>
                    <p className="text-xs text-portal-note-text">
                      {client.invoiceCount} فاتورة
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-natural-100">
                    {formatSAR(client.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

function ProjectsSection() {
  const { data, isLoading, isError } = useGetAdminReportProjectsQuery();

  if (isLoading) {
    return (
      <SurfaceCard title="المشاريع" icon={FolderKanban}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-28 rounded-[30px]" />
            <Skeleton className="h-28 rounded-[30px]" />
          </div>
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </SurfaceCard>
    );
  }

  if (isError || !data) {
    return (
      <SurfaceCard title="المشاريع" icon={FolderKanban}>
        <AdminEmptyState
          icon={FolderKanban}
          title="تعذر تحميل تقرير المشاريع"
          description="حدث خطأ أثناء جلب البيانات. يرجى المحاولة لاحقاً."
        />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard title="المشاريع" icon={FolderKanban}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard
            title="إجمالي المشاريع"
            value={data.total}
            icon={FolderKanban}
          />
          <MetricCard
            title="معدل الإنجاز"
            value={"٪" + data.completionRate}
            icon={TrendingUp}
            variant={data.completionRate > 70 ? "success" : "warning"}
          />
          <MetricCard
            title="متوسط المدة (أيام)"
            value={data.avgDuration}
            icon={Clock}
          />
          <MetricCard
            title="متأخر"
            value={data.overdueCount}
            icon={AlertTriangle}
            variant={data.overdueCount > 0 ? "danger" : "success"}
          />
        </div>

        {data.byStatus.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-portal-note-text mb-3">
              المشاريع حسب الحالة
            </h3>
            <div className="space-y-2">
              {data.byStatus.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-2.5"
                >
                  <span className="text-sm text-natural-100">
                    {item.status}
                  </span>
                  <span className="text-sm font-semibold text-natural-100">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

function SatisfactionSection() {
  const { data, isLoading, isError } = useGetAdminReportSatisfactionQuery();

  if (isLoading) {
    return (
      <SurfaceCard title="رضا العملاء" icon={Smile}>
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-[30px]" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </SurfaceCard>
    );
  }

  if (isError || !data) {
    return (
      <SurfaceCard title="رضا العملاء" icon={Smile}>
        <AdminEmptyState
          icon={Smile}
          title="تعذر تحميل تقرير الرضا"
          description="حدث خطأ أثناء جلب البيانات. يرجى المحاولة لاحقاً."
        />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard title="رضا العملاء" icon={Smile}>
      <div className="space-y-5">
        <MetricCard
          title="متوسط التقييم"
          value={data.avgScore.toFixed(1) + " / 5"}
          icon={Star}
          variant={
            data.avgScore >= 4
              ? "success"
              : data.avgScore >= 3
                ? "warning"
                : "danger"
          }
        />

        {data.ratingsByScore.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-portal-note-text mb-3">
              التقييمات حسب الدرجة
            </h3>
            <div className="space-y-2">
              {data.ratingsByScore.map((item) => (
                <div
                  key={item.score}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-2.5"
                >
                  <span className="text-sm text-natural-100">
                    {item.score} نجوم
                  </span>
                  <span className="text-sm font-semibold text-natural-100">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.trend.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-portal-note-text mb-3">
              الاتجاه الشهري
            </h3>
            <div className="space-y-2">
              {data.trend.map((item) => (
                <div
                  key={item.month}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-2.5"
                >
                  <span className="text-sm text-natural-100">{item.month}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-natural-100">
                      {item.avgScore.toFixed(1)}
                    </span>
                    <span className="text-xs text-portal-note-text">
                      ({item.count})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

export default function AdminReportsPage() {
  return (
    <div className="page-shell" dir="rtl">
      <PageIntro
        title="التقارير"
        description="نظرة شاملة على أداء المنصة: المبيعات، الإيرادات، المشاريع، ورضا العملاء"
        icon={BarChart3}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SalesSection />
        <RevenueSection />
        <ProjectsSection />
        <SatisfactionSection />
      </div>
    </div>
  );
}
