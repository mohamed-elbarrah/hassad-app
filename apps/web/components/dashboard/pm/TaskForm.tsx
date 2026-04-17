"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import { useCreateTaskMutation } from "@/features/tasks/tasksApi";
import { TaskDepartment, TaskPriority } from "@hassad/shared";

// ── Labels ────────────────────────────────────────────────────────────────────

const DEPT_LABELS: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "تصميم",
  [TaskDepartment.MARKETING]: "تسويق",
  [TaskDepartment.DEVELOPMENT]: "تطوير",
  [TaskDepartment.CONTENT]: "محتوى",
  [TaskDepartment.MANAGEMENT]: "إدارة",
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
  assignedTo: z.string().min(1, "معرّف المُكلَّف مطلوب"),
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

  async function onSubmit(values: TaskFormValues) {
    try {
      await createTask({
        projectId,
        body: {
          title: values.title,
          assignedTo: values.assignedTo,
          dept: values.dept,
          priority: values.priority,
          dueDate: new Date(values.dueDate),
          description: values.description || undefined,
        },
      }).unwrap();
      toast.success("تم إنشاء المهمة بنجاح.");
      form.reset();
      setOpen(false);
    } catch {
      toast.error("فشل إنشاء المهمة. يرجى المحاولة مجدداً.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4 mr-1" />
          مهمة جديدة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إنشاء مهمة جديدة</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>معرّف المُكلَّف</FormLabel>
                  <FormControl>
                    <Input placeholder="CUID الخاص بالمستخدم" {...field} />
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
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر القسم" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TaskDepartment).map((d) => (
                          <SelectItem key={d} value={d}>
                            {DEPT_LABELS[d]}
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="عادي" />
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
                    <Input
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "جارٍ الإنشاء..." : "إنشاء المهمة"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
