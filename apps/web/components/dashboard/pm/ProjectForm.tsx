"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Dialog } from "@/components/design-system/Dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Select, SelectItem } from "@/components/design-system/Select";
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
  [ProjectStatus.AWAITING_REVIEW]: "بانتظار المراجعة",
  [ProjectStatus.NEEDS_REVISION]: "مطلوب تعديلات",
  [ProjectStatus.COMPLETED]: "مكتمل",
  [ProjectStatus.CANCELLED]: "ملغي",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "منخفض",
  [TaskPriority.NORMAL]: "عادي",
  [TaskPriority.HIGH]: "عالي",
  [TaskPriority.URGENT]: "عاجل",
};

// ── Form schemas ──────────────────────────────────────────────────────────────

const ProjectCreateFormSchema = z.object({
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

const ProjectEditFormSchema = z.object({
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus),
  priority: z.nativeEnum(TaskPriority),
  startDate: z.string().min(1, "تاريخ البدء مطلوب"),
  endDate: z.string().min(1, "تاريخ الانتهاء مطلوب"),
});

type ProjectCreateFormValues = z.infer<typeof ProjectCreateFormSchema>;
type ProjectEditFormValues = z.infer<typeof ProjectEditFormSchema>;

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectFormProps {
  project?: Project;
  currentUserId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectForm({ project, currentUserId }: ProjectFormProps) {
  const [open, setOpen] = useState(false);
  const isEdit = !!project;

  const [clientSearch, setClientSearch] = useState("");
  const [managerSearch, setManagerSearch] = useState("");

  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const isLoading = isCreating || isUpdating;

  const { data: clientsData, isFetching: clientsFetching } = useGetClientsQuery(
    { search: clientSearch, limit: 20 },
    { skip: !open || isEdit },
  );

  const { data: usersData, isFetching: usersFetching } = useSearchUsersQuery(
    { search: managerSearch, role: UserRole.PM, limit: 20 },
    { skip: !open || isEdit },
  );

  const clientOptions = (clientsData?.items ?? []).map((c) => ({
    id: c.id,
    label: c.companyName,
  }));

  const managerOptions = (usersData?.items ?? []).map((u) => ({
    id: u.id,
    label: u.name,
  }));

  const createForm = useForm<ProjectCreateFormValues>({
    resolver: zodResolver(ProjectCreateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      clientId: "",
      contractId: "",
      projectManagerId: currentUserId,
      status: ProjectStatus.PLANNING,
      priority: TaskPriority.NORMAL,
      startDate: "",
      endDate: "",
    },
  });

  const editForm = useForm<ProjectEditFormValues>({
    resolver: zodResolver(ProjectEditFormSchema),
    defaultValues: {
      description: project?.description ?? "",
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

  async function onSubmit(values: any) {
    try {
      if (isEdit && project) {
        await updateProject({
          id: project.id,
          body: {
            description: values.description || undefined,
            status: values.status,
            priority: values.priority,
            startDate: values.startDate,
            endDate: values.endDate,
          },
        }).unwrap();
        toast.success("تم تحديث المشروع بنجاح.");
      } else {
        await createProject({
          name: values.name,
          description: values.description || undefined,
          clientId: values.clientId,
          contractId: values.contractId || undefined,
          projectManagerId: values.projectManagerId,
          status: values.status,
          priority: values.priority,
          startDate: values.startDate,
          endDate: values.endDate,
        }).unwrap();
        toast.success("تم إنشاء المشروع بنجاح.");
      }
      if (isEdit) {
        editForm.reset();
      } else {
        createForm.reset();
      }
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
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={isEdit ? "تعديل المشروع" : "إنشاء مشروع جديد"}
      contentClassName="sm:max-w-lg"
    >
      {isEdit ? (
        <ActionButton
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          icon={<Pencil className="size-4" />}
        >
          تعديل
        </ActionButton>
      ) : (
        <ActionButton
          onClick={() => setOpen(true)}
          icon={<Plus className="size-4" />}
        >
          مشروع جديد
        </ActionButton>
      )}

      {isEdit ? (
        <Form {...editForm}>
          <form
            onSubmit={editForm.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={editForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف (اختياري)</FormLabel>
                  <FormControl>
                    <FormInputControl
                      placeholder="وصف المشروع"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      placeholder="اختر الحالة"
                    >
                      {Object.values(ProjectStatus).map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الأولوية</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      placeholder="اختر الأولوية"
                    >
                      {Object.values(TaskPriority).map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={editForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ البدء</FormLabel>
                    <FormControl>
                      <FormInputControl type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الانتهاء</FormLabel>
                    <FormControl>
                      <FormInputControl type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                إلغاء
              </ActionButton>
              <ActionButton type="submit" disabled={isLoading}>
                {isLoading ? "جارٍ الحفظ..." : "حفظ التعديلات"}
              </ActionButton>
            </div>
          </form>
        </Form>
      ) : (
        <Form {...createForm}>
          <form
            onSubmit={createForm.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={createForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المشروع</FormLabel>
                  <FormControl>
                    <FormInputControl
                      placeholder="أدخل اسم المشروع"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={createForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف (اختياري)</FormLabel>
                  <FormControl>
                    <FormInputControl
                      placeholder="وصف المشروع"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={createForm.control}
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

            <FormField
              control={createForm.control}
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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={createForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      placeholder="اختر الحالة"
                    >
                      {Object.values(ProjectStatus).map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الأولوية</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      placeholder="اختر الأولوية"
                    >
                      {Object.values(TaskPriority).map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={createForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ البدء</FormLabel>
                    <FormControl>
                      <FormInputControl type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الانتهاء</FormLabel>
                    <FormControl>
                      <FormInputControl type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                إلغاء
              </ActionButton>
              <ActionButton type="submit" disabled={isLoading}>
                {isLoading ? "جارٍ الحفظ..." : "إنشاء المشروع"}
              </ActionButton>
            </div>
          </form>
        </Form>
      )}
    </Dialog>
  );
}
