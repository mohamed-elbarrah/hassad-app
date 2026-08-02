"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import {
  ProjectStatus,
  TaskPriority,
  TASK_PRIORITY_AR,
  UserRole,
  type Project,
} from "@hassad/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGetClientsQuery } from "@/features/clients/clientsApi";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from "@/features/projects/projectsApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
import { PROJECT_STATUS_LABELS } from "@/lib/utils/project-status";

const schema = z.object({
  name: z.string().min(2, "اسم المشروع يجب أن يكون حرفين على الأقل"),
  description: z.string().optional(),
  clientId: z.string().min(1, "العميل مطلوب"),
  projectManagerId: z.string().min(1, "مدير المشروع مطلوب"),
  status: z.nativeEnum(ProjectStatus),
  priority: z.nativeEnum(TaskPriority),
  startDate: z.string().min(1, "تاريخ البدء مطلوب"),
  endDate: z.string().min(1, "تاريخ الانتهاء مطلوب"),
});
type Values = z.infer<typeof schema>;

export function ProjectForm({
  project,
  currentUserId,
}: {
  project?: Project;
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const editing = !!project;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
      clientId: project?.clientId || "",
      projectManagerId: project?.projectManagerId || currentUserId,
      status: (project?.status as ProjectStatus) || ProjectStatus.PLANNING,
      priority: (project?.priority as TaskPriority) || TaskPriority.NORMAL,
      startDate: project?.startDate
        ? new Date(project.startDate).toISOString().slice(0, 10)
        : "",
      endDate: project?.endDate
        ? new Date(project.endDate).toISOString().slice(0, 10)
        : "",
    },
  });
  const { data: clientsData } = useGetClientsQuery(
    { limit: 100 },
    { skip: !open },
  );
  const { data: managersData } = useSearchUsersQuery(
    { role: UserRole.PM, limit: 100 },
    { skip: !open },
  );
  const [createProject, { isLoading: creating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: updating }] = useUpdateProjectMutation();
  const saving = creating || updating;
  async function submit(values: Values) {
    try {
      if (editing && project)
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
      else
        await createProject({
          ...values,
          description: values.description || undefined,
        }).unwrap();
      toast.success(
        editing ? "تم تحديث المشروع بنجاح." : "تم إنشاء المشروع بنجاح.",
      );
      setOpen(false);
    } catch {
      toast.error(
        editing
          ? "فشل تحديث المشروع. يرجى المحاولة مجدداً."
          : "فشل إنشاء المشروع. يرجى المحاولة مجدداً.",
      );
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={editing ? "outline" : "default"}
          size={editing ? "sm" : "default"}
        >
          {editing ? (
            <Pencil data-icon="inline-start" />
          ) : (
            <Plus data-icon="inline-start" />
          )}
          {editing ? "تعديل" : "مشروع جديد"}
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "تعديل المشروع" : "إنشاء مشروع جديد"}
          </DialogTitle>
          <DialogDescription>
            أدخل معلومات المشروع الأساسية ثم احفظ التغييرات.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المشروع</FormLabel>
                  <FormControl>
                    <Input disabled={editing} {...field} />
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
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!editing && (
              <>
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العميل</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر العميل" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {(clientsData?.items || []).map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.companyName}
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
                  name="projectManagerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مدير المشروع</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المدير" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {(managersData?.items || []).map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                form={form}
                name="status"
                label="الحالة"
                values={Object.values(ProjectStatus)}
                labels={PROJECT_STATUS_LABELS}
              />
              <SelectField
                form={form}
                name="priority"
                label="الأولوية"
                values={Object.values(TaskPriority)}
                labels={TASK_PRIORITY_AR}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "جارٍ الحفظ..."
                  : editing
                    ? "حفظ التعديلات"
                    : "إنشاء المشروع"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
function SelectField({
  form,
  name,
  label,
  values,
  labels,
}: {
  form: ReturnType<typeof useForm<Values>>;
  name: "status" | "priority";
  label: string;
  values: string[];
  labels: Record<string, string>;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectGroup>
                {values.map((value) => (
                  <SelectItem key={value} value={value}>
                    {labels[value]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
