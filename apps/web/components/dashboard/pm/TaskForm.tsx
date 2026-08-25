"use client";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { useState, useEffect, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { X, Search, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePmProjectTaskMutation } from "@/features/tasks/tasksApi";
import { useSearchTaskAssigneesQuery } from "@/features/users/usersApi";
import { TaskDepartment, TaskPriority } from "@hassad/shared";
import { cn } from "@/lib/utils";
import { pmErrorMessage, pmSuccessMessage } from "@/lib/i18n";

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
  periodId?: string;
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
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(true)} className="min-w-0 flex-1 justify-start">
            <span className="size-8 shrink-0 rounded-full bg-muted text-center text-sm font-semibold leading-8">
              {selected.name.charAt(0)}
            </span>
            <span className="min-w-0 truncate text-start">
              <span className="block truncate font-medium">{selected.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{selected.role}</span>
            </span>
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange("")} aria-label="إزالة المسند إليه">
            <X />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => dept && setOpen(true)}
          disabled={!dept}
          className="w-full justify-between"
        >
          <span>{!dept ? "اختر القسم أولاً" : "اختر المسند إليه"}</span>
          <ChevronDown data-icon="inline-end" />
        </Button>
      )}

      {/* Dropdown */}
      {open && dept && (
        <div className="relative mt-1 w-full overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md">
          {/* Search box inside dropdown */}
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الدور..."
                aria-label="البحث عن المسند إليه"
                className="pe-9"
                autoFocus
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto">
            {isFetching ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                جارٍ التحميل...
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
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
                      "flex w-full items-center gap-3 px-3 py-2.5 text-right transition-colors hover:bg-muted",
                      user.id === value && "bg-secondary",
                    )}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1 text-right">
                      <div className="text-sm font-medium text-foreground">
                        {user.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
  periodId,
  open: openProp,
  onOpenChange,
}: TaskFormProps) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = (value: boolean) => {
    if (openProp === undefined) setOpenInternal(value);
    onOpenChange?.(value);
  };
  const [createTask, { isLoading }] = useCreatePmProjectTaskMutation();

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
        periodId,
        title: values.title,
        assignedTo: values.assignedTo || undefined,
        dept: values.dept,
        priority: values.priority,
        dueDate: new Date(values.dueDate),
        description: values.description || undefined,
      }).unwrap();
      toast.success(pmSuccessMessage("TASK_CREATED"));
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error(pmErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent dir="rtl" className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إنشاء مهمة جديدة</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان المهمة</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل عنوان المهمة" {...field} />
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر القسم" />
                        </SelectTrigger>
                      </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {Object.values(TaskDepartment).map((d) => (
                              <SelectItem key={d} value={d}>
                                {DEPT_LABELS[d]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="عادي" />
                        </SelectTrigger>
                      </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {Object.values(TaskPriority).map((p) => (
                              <SelectItem key={p} value={p}>
                                {PRIORITY_LABELS[p]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
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
                  <AssigneeDropdown
                    value={field.value}
                    onChange={field.onChange}
                    dept={watchedDept}
                  />
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
                    <Input type="date" {...field} />
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
                    <Textarea
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "جارٍ الإنشاء..." : "إنشاء المهمة"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
