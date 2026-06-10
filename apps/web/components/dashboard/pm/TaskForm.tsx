"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import { useCreateTaskMutation } from "@/features/tasks/tasksApi";
import { useSearchTaskAssigneesQuery } from "@/features/users/usersApi";
import { SearchCombobox } from "@/components/common/SearchCombobox";
import { TaskDepartment, TaskPriority } from "@hassad/shared";

// ── Labels ────────────────────────────────────────────────────────────────────

const DEPT_LABELS: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "تصميم",
  [TaskDepartment.MARKETING]: "تسويق",
  [TaskDepartment.DEVELOPMENT]: "تطوير",
  [TaskDepartment.CONTENT]: "محتوى",
  [TaskDepartment.PRODUCTION]: "مونتاج",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "منخفض",
  [TaskPriority.NORMAL]: "عادي",
  [TaskPriority.HIGH]: "عالي",
  [TaskPriority.URGENT]: "عاجل",
};

// ── Form schema ───────────────────────────────────────────────────────────────

const TaskFormSchema = z.object({
  title: z.string().min(2, "عنوان المهمة يجب أن يكون حرفين على الأقل"),
  assignedTo: z.string().min(1, "المسند إليه مطلوب"),
  dept: z.nativeEnum(TaskDepartment, { message: "القسم مطلوب" }),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().min(1, "تاريخ الاستحقاق مطلوب"),
  description: z.string().optional(),
});

type TaskFormValues = z.infer<typeof TaskFormSchema>;

// ── Types ─────────────────────────────────────────────────────────────────────

interface TaskFormProps {
  projectId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TaskForm({ projectId }: TaskFormProps) {
  const [open, setOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [createTask, { isLoading }] = useCreateTaskMutation();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      title: "",
      assignedTo: "",
      dept: undefined,
      priority: TaskPriority.NORMAL,
      dueDate: "",
      description: "",
    },
  });

  const watchedDept = form.watch("dept");

  // Reset assignee whenever department changes
  useEffect(() => {
    form.setValue("assignedTo", "");
    setAssigneeSearch("");
  }, [watchedDept, form]);

  const { data: usersData, isFetching: usersLoading } =
    useSearchTaskAssigneesQuery(
      { dept: watchedDept, search: assigneeSearch, limit: 20 },
      { skip: !open || !watchedDept },
    );

  const assigneeOptions =
    usersData?.items.map((u) => ({
      id: u.id,
      label: u.name,
    })) ?? [];

  async function onSubmit(values: TaskFormValues) {
    try {
      await createTask({
        projectId,
        title: values.title,
        assignedTo: values.assignedTo || undefined,
        dept: values.dept,
        priority: values.priority,
        dueDate: new Date(values.dueDate),
        description: values.description || undefined,
      }).unwrap();
      toast.success("تم إنشاء المهمة بنجاح.");
      form.reset();
      setAssigneeSearch("");
      setOpen(false);
    } catch {
      toast.error("فشل إنشاء المهمة. يرجى المحاولة مجدداً.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="إنشاء مهمة جديدة"
      contentClassName="sm:max-w-md"
    >
      <ActionButton
        size="sm"
        onClick={() => setOpen(true)}
        icon={<Plus className="size-4" />}
      >
        مهمة جديدة
      </ActionButton>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>عنوان المهمة</FormLabel>
                <FormControl>
                  <FormInputControl
                    placeholder="أدخل عنوان المهمة"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="dept"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>القسم</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    placeholder="اختر القسم"
                  >
                    {Object.values(TaskDepartment).map((d) => (
                      <SelectItem key={d} value={d}>
                        {DEPT_LABELS[d]}
                      </SelectItem>
                    ))}
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    placeholder="عادي"
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

          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المسند إليه</FormLabel>
                <FormControl>
                  <SearchCombobox
                    value={field.value}
                    onChange={field.onChange}
                    options={assigneeOptions}
                    onSearchChange={setAssigneeSearch}
                    placeholder={
                      watchedDept ? "اختر المسند إليه" : "اختر القسم أولاً"
                    }
                    searchPlaceholder="ابحث بالاسم..."
                    isLoading={usersLoading}
                    disabled={!watchedDept}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ الاستحقاق</FormLabel>
                <FormControl>
                  <FormInputControl type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الوصف (اختياري)</FormLabel>
                <FormControl>
                  <FormInputControl
                    placeholder="وصف المهمة"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3 pt-2">
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </ActionButton>
            <ActionButton type="submit" disabled={isLoading}>
              {isLoading ? "جارٍ الإنشاء..." : "إنشاء المهمة"}
            </ActionButton>
          </div>
        </form>
      </Form>
    </Dialog>
  );
}
