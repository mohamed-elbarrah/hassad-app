"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from "@/features/projects/projectsApi";
import { useGetClientsQuery } from "@/features/clients/clientsApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
import { SearchCombobox } from "@/components/common/SearchCombobox";
import { UserRole, ProjectStatus, TaskPriority } from "@hassad/shared";
import type { Project } from "@hassad/shared";

// ── Labels ────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "تخطيط",
  [ProjectStatus.ACTIVE]: "نشط",
  [ProjectStatus.ON_HOLD]: "متوقف مؤقتاً",
  [ProjectStatus.COMPLETED]: "مكتمل",
  [ProjectStatus.CANCELLED]: "ملغي",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "منخفض",
  [TaskPriority.NORMAL]: "عادي",
  [TaskPriority.HIGH]: "عالي",
  [TaskPriority.URGENT]: "عاجل",
};

// ── Form schema ───────────────────────────────────────────────────────────────

const ProjectFormSchema = z.object({
  name: z.string().min(2, "اسم المشروع يجب أن يكون حرفين على الأقل"),
  description: z.string().optional(),
  clientId: z.string().min(1, "العميل مطلوب"),
  contractId: z.string().optional(),
  projectManagerId: z.string().min(1, "مدير المشروع مطلوب"),
  status: z.nativeEnum(ProjectStatus),
  priority: z.nativeEnum(TaskPriority),
  startDate: z.string().min(1, "تاريخ البدء مطلوب"),
  endDate: z.string().min(1, "تاريخ الانتهاء مطلوب"),
});

type ProjectFormValues = z.infer<typeof ProjectFormSchema>;

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectFormProps {
  /** When provided, the form is in edit mode */
  project?: Project;
  /** Current user's ID — used to pre-fill projectManagerId */
  currentUserId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectForm({ project, currentUserId }: ProjectFormProps) {
  const [open, setOpen] = useState(false);
  const isEdit = !!project;

  // Search state for comboboxes
  const [clientSearch, setClientSearch] = useState("");
  const [managerSearch, setManagerSearch] = useState("");

  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const isLoading = isCreating || isUpdating;

  const { data: clientsData, isFetching: clientsFetching } = useGetClientsQuery(
    { search: clientSearch, limit: 20 },
    { skip: !open },
  );

  const { data: usersData, isFetching: usersFetching } = useSearchUsersQuery(
    { search: managerSearch, role: UserRole.PM, limit: 20 },
    { skip: !open },
  );

  const clientOptions = (clientsData?.items ?? []).map((c) => ({
    id: c.id,
    label: c.companyName,
  }));

  const managerOptions = (usersData?.items ?? []).map((u) => ({
    id: u.id,
    label: u.name,
  }));

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(ProjectFormSchema),
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      clientId: project?.clientId ?? "",
      contractId: project?.contractId ?? "",
      projectManagerId: project?.projectManagerId ?? currentUserId,
      status: (project?.status as ProjectStatus) ?? ProjectStatus.PLANNING,
      priority: (project?.priority as TaskPriority) ?? TaskPriority.NORMAL,
      startDate: project?.startDate
        ? new Date(project.startDate).toISOString().split("T")[0]
        : "",
      endDate: project?.endDate
        ? new Date(project.endDate).toISOString().split("T")[0]
        : "",
    },
  });

  async function onSubmit(values: ProjectFormValues) {
    // Dates from <input type="date"> are already ISO date strings (YYYY-MM-DD)
    // which satisfy @IsDateString() on the backend.
    const body = {
      name: values.name,
      description: values.description || undefined,
      clientId: values.clientId,
      contractId: values.contractId || undefined,
      projectManagerId: values.projectManagerId,
      status: values.status,
      priority: values.priority,
      startDate: values.startDate,
      endDate: values.endDate,
    };

    try {
      if (isEdit && project) {
        await updateProject({ id: project.id, body }).unwrap();
        toast.success("تم تحديث المشروع بنجاح.");
      } else {
        await createProject(body).unwrap();
        toast.success("تم إنشاء المشروع بنجاح.");
      }
      form.reset();
      setOpen(false);
    } catch {
      toast.error(
        isEdit
          ? "فشل تحديث المشروع. يرجى المحاولة مجدداً."
          : "فشل إنشاء المشروع. يرجى المحاولة مجدداً.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="sm">
            <Pencil className="size-4 mr-1" />
            تعديل
          </Button>
        ) : (
          <Button>
            <Plus className="size-4 mr-1" />
            مشروع جديد
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "تعديل المشروع" : "إنشاء مشروع جديد"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المشروع</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسم المشروع" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف (اختياري)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="وصف المشروع"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العميل</FormLabel>
                  <FormControl>
                    <SearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      options={clientOptions}
                      onSearchChange={setClientSearch}
                      placeholder="ابحث عن العميل..."
                      searchPlaceholder="اكتب اسم العميل"
                      isLoading={clientsFetching}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Manager */}
            <FormField
              control={form.control}
              name="projectManagerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مدير المشروع</FormLabel>
                  <FormControl>
                    <SearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      options={managerOptions}
                      onSearchChange={setManagerSearch}
                      placeholder="ابحث عن مدير المشروع..."
                      searchPlaceholder="اكتب اسم المدير"
                      isLoading={usersFetching}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ProjectStatus).map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الأولوية</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الأولوية" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TaskPriority).map((p) => (
                          <SelectItem key={p} value={p}>
                            {PRIORITY_LABELS[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ البدء</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الانتهاء</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "جارٍ الحفظ..."
                  : isEdit
                    ? "حفظ التعديلات"
                    : "إنشاء المشروع"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
