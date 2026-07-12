"use client";

import { use } from "react";
import { CalendarDays } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { useGetAdminProjectByIdQuery } from "@/features/admin/adminProjectsApi";
import { cn } from "@/lib/utils";

const COLUMNS: DataTableColumn[] = [
  { id: "number", label: "رقم الفترة", align: "right" },
  { id: "dates", label: "المدة", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "completion", label: "الإنجاز", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: CalendarDays,
  message: "لا توجد فترات",
  hint: "لم يتم إضافة أي فترات لهذا المشروع بعد.",
};

export default function PeriodsTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project } = useGetAdminProjectByIdQuery(id);

  if (!project) return null;

  return (
    <SurfaceCard title="فترات المشروع">
      <DataTable
        columns={COLUMNS}
        data={project.periods}
        isLoading={false}
        isError={false}
        emptyState={EMPTY_STATE}
        renderRow={(period) => (
          <tr
            key={period.id}
            className="border-b border-portal-divider last:border-0"
          >
            <td className="py-3 px-2 text-right text-sm font-medium text-natural-100">
              الفترة {period.periodNumber}
            </td>
            <td className="py-3 px-2 text-right text-sm text-portal-note-text">
              {new Date(period.startDate).toLocaleDateString("ar-SA")}
              {" - "}
              {new Date(period.endDate).toLocaleDateString("ar-SA")}
            </td>
            <td className="py-3 px-2 text-right">
              <AdminStatusBadge domain="project" status={period.status} />
            </td>
            <td className="py-3 px-2 text-right">
              <div className="flex items-center gap-2">
                <div className="h-2 w-16 rounded-full bg-portal-divider overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      period.completionPercentage >= 80
                        ? "bg-success-500"
                        : period.completionPercentage >= 40
                          ? "bg-secondary-500"
                          : "bg-warning-500",
                    )}
                    style={{ width: `${period.completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs text-portal-note-text">
                  {period.completionPercentage}%
                </span>
              </div>
            </td>
          </tr>
        )}
      />
    </SurfaceCard>
  );
}
