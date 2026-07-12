"use client";

import { use } from "react";
import { ListTodo } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { useGetAdminProjectByIdQuery } from "@/features/admin/adminProjectsApi";

const COLUMNS: DataTableColumn[] = [
  { id: "title", label: "المهمة", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "priority", label: "الأولوية", align: "right" },
  { id: "dueDate", label: "تاريخ الاستحقاق", align: "right" },
  { id: "assignedTo", label: "مسندة إلى", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: ListTodo,
  message: "لا توجد مهام",
  hint: "لم يتم إضافة أي مهام لهذا المشروع بعد.",
};

export default function TasksTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project } = useGetAdminProjectByIdQuery(id);

  if (!project) return null;

  return (
    <SurfaceCard title="مهام المشروع">
      <DataTable
        columns={COLUMNS}
        data={project.tasks}
        isLoading={false}
        isError={false}
        emptyState={EMPTY_STATE}
        renderRow={(task) => (
          <tr
            key={task.id}
            className="border-b border-portal-divider last:border-0"
          >
            <td className="py-3 px-2 text-right text-sm font-medium text-natural-100">
              {task.title}
            </td>
            <td className="py-3 px-2 text-right">
              <AdminStatusBadge domain="task" status={task.status} />
            </td>
            <td className="py-3 px-2 text-right">
              <AdminStatusBadge domain="task" status={task.priority} />
            </td>
            <td className="py-3 px-2 text-right text-sm text-portal-note-text">
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString("ar-SA")
                : "—"}
            </td>
            <td className="py-3 px-2 text-right text-sm text-portal-note-text">
              {task.assignedTo || "—"}
            </td>
          </tr>
        )}
      />
    </SurfaceCard>
  );
}
