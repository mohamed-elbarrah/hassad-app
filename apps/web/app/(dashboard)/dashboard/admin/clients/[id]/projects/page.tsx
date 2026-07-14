"use client";

import { use } from "react";
import { FolderOpen } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { useGetAdminClientByIdQuery } from "@/features/admin/adminClientsApi";

const COLUMNS: DataTableColumn[] = [
  { id: "name", label: "المشروع", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "progress", label: "الإنجاز", align: "right" },
  { id: "pm", label: "مدير المشروع", align: "right" },
  { id: "startDate", label: "تاريخ البداية", align: "right" },
  { id: "endDate", label: "تاريخ النهاية", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: FolderOpen,
  message: "لا توجد مشاريع",
  hint: "لم يتم إضافة أي مشاريع لهذا العميل بعد.",
};

export default function ClientProjectsTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: client } = useGetAdminClientByIdQuery(id);

  if (!client) return null;

  return (
    <SurfaceCard title="المشاريع">
      <DataTable
        columns={COLUMNS}
        data={client.projects}
        isLoading={false}
        isError={false}
        emptyState={EMPTY_STATE}
        renderRow={(project) => (
          <tr
            key={project.id}
            className="border-b border-portal-divider last:border-0"
          >
            <td className="py-3 px-2 text-right text-sm font-medium text-natural-100">
              {project.name}
            </td>
            <td className="py-3 px-2 text-right">
              <AdminStatusBadge domain="project" status={project.status} />
            </td>
            <td className="py-3 px-2 text-right">
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary-500 rounded-full"
                    style={{
                      width: `${project.completionPercentage}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-portal-note-text">
                  {project.completionPercentage}%
                </span>
              </div>
            </td>
            <td className="py-3 px-2 text-right text-sm text-portal-note-text">
              {project.pmName || "—"}
            </td>
            <td className="py-3 px-2 text-right text-sm text-portal-note-text">
              {project.startDate
                ? new Date(project.startDate).toLocaleDateString("ar-SA")
                : "—"}
            </td>
            <td className="py-3 px-2 text-right text-sm text-portal-note-text">
              {project.endDate
                ? new Date(project.endDate).toLocaleDateString("ar-SA")
                : "—"}
            </td>
          </tr>
        )}
      />
    </SurfaceCard>
  );
}
