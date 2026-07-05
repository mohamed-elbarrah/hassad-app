"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, X, Search, ChevronDown, User } from "lucide-react";
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
import { FormTextareaControl } from "@/components/design-system/FormTextareaControl";
import { Select, SelectItem } from "@/components/design-system/Select";
import { useCreateTaskMutation } from "@/features/tasks/tasksApi";
import { useSearchTaskAssigneesQuery } from "@/features/users/usersApi";
import { TaskDepartment, TaskPriority } from "@hassad/shared";
import { cn } from "@/lib/utils";

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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface AssigneeOption {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string | null;
}

// ── Assignee Dropdown with Search ─────────────────────────────────────────────

function AssigneeDropdown({
  value,
  onChange,
  dept,
}: {
  value: string;
  onChange: (id: string) => void;
  dept?: TaskDepartment;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useSearchTaskAssigneesQuery(
    { dept, limit: 50 },
    { skip: !dept || !open },
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset search when dropdown opens
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  const users: AssigneeOption[] = useMemo(() => {
    return (data?.items ?? []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
    }));
  }, [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [users, search]);

  const selected = users.find((u) => u.id === value);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Trigger */}
      {selected ? (
        <div
          className="flex items-center gap-2 rounded-xl border border-portal-card-border bg-badge-gray-bg px-3 py-2 cursor-pointer"
          onClick={() => setOpen(true)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 text-secondary-600 text-sm font-semibold shrink-0">
            {selected.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-natural-100 truncate">
              {selected.name}
            </div>
            <div className="text-[11px] text-portal-note-text">
              {selected.role}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="rounded-full p-1 text-portal-note-text hover:bg-badge-gray-bg hover:text-natural-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => dept && setOpen(true)}
          disabled={!dept}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors",
            !dept
              ? "border-portal-card-border bg-badge-gray-bg text-portal-note-text cursor-not-allowed"
              : "border-portal-card-border bg-white text-natural-100 hover:border-secondary-300 cursor-pointer",
          )}
        >
          <span className={cn(!dept && "text-portal-note-text")}>
            {!dept ? "اختر القسم أولاً" : "اختر المسند إليه"}
          </span>
          <ChevronDown className="h-4 w-4 text-portal-note-text" />
        </button>
      )}

      {/* Dropdown */}
      {open && dept && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-portal-card-border bg-white shadow-lg overflow-hidden">
          {/* Search box inside dropdown */}
          <div className="border-b border-portal-divider p-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-portal-note-text" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الدور..."
                className="w-full rounded-lg border border-portal-card-border bg-badge-gray-bg py-2 pr-9 pl-3 text-sm text-natural-100 placeholder:text-portal-note-text focus:border-secondary-500 focus:outline-none focus:ring-1 focus:ring-secondary-500/20"
                autoFocus
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto">
            {isFetching ? (
              <div className="px-3 py-4 text-sm text-portal-note-text text-center">
                جارٍ التحميل...
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-portal-note-text text-center">
                {users.length === 0
                  ? "لا يوجد مستخدمون في هذا القسم"
                  : "لا توجد نتائج مطابقة"}
              </div>
            ) : (
              <div className="py-1">
                {filtered.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      onChange(user.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-right transition-colors hover:bg-badge-gray-bg",
                      user.id === value && "bg-secondary-50",
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-badge-gray-bg text-natural-100 text-sm font-semibold shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className="text-sm font-medium text-natural-100">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-portal-note-text flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {user.role}
                        {user.department && (
                          <>
                            <span className="mx-1">·</span>
                            {user.department}
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TaskForm({
  projectId,
  open: openProp,
  onOpenChange,
}: TaskFormProps) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = (value: boolean) => {
    if (openProp === undefined) setOpenInternal(value);
    onOpenChange?.(value);
  };
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
  }, [watchedDept, form]);

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
      setOpen(false);
    } catch {
      toast.error("فشل إنشاء المهمة. يرجى المحاولة مجدداً.");
    }
  }

  return (
    <>
      <ActionButton
        size="sm"
        onClick={() => setOpen(true)}
        icon={<Plus className="size-4" />}
      >
        مهمة جديدة
      </ActionButton>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="إنشاء مهمة جديدة"
        contentClassName="sm:max-w-md"
      >
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
                    <AssigneeDropdown
                      value={field.value}
                      onChange={field.onChange}
                      dept={watchedDept}
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
                    <FormTextareaControl
                      placeholder="وصف المهمة"
                      rows={3}
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
    </>
  );
}
