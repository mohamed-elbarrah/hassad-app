"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import {
  FormSelect,
  FormSelectContent,
  FormSelectItem,
  FormSelectTrigger,
  FormSelectValue,
} from "@/components/design-system/FormSelectControl";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  type UserDetail,
} from "@/features/users/usersApi";
import { UserRole, TaskDepartment } from "@hassad/shared";

// ── Labels ────────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "مدير النظام",
  [UserRole.PM]: "مدير مشروع",
  [UserRole.SALES]: "مبيعات",
  [UserRole.EMPLOYEE]: "موظف",
  [UserRole.MARKETING]: "تسويق",
  [UserRole.ACCOUNTANT]: "محاسب",
  [UserRole.CLIENT]: "عميل",
};

const DEPARTMENT_LABELS: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "تصميم",
  [TaskDepartment.MARKETING]: "تسويق",
  [TaskDepartment.DEVELOPMENT]: "تطوير",
  [TaskDepartment.CONTENT]: "محتوى",
  [TaskDepartment.PRODUCTION]: "مونتاج",
};

// ── Schemas ───────────────────────────────────────────────────────────────────

const CreateEmployeeSchema = z
  .object({
    name: z.string().min(2, "الاسم مطلوب"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
    role: z.nativeEnum(UserRole),
    department: z.nativeEnum(TaskDepartment).optional(),
  })
  .refine(
    (data) => data.role !== UserRole.EMPLOYEE || data.department !== undefined,
    {
      path: ["department"],
      message: "القسم مطلوب للموظفين",
    },
  );

const EditEmployeeSchema = z
  .object({
    name: z.string().min(2, "الاسم مطلوب"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    password: z.union([
      z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
      z.literal(""),
    ]),
    role: z.nativeEnum(UserRole),
    department: z.nativeEnum(TaskDepartment).optional(),
  })
  .refine(
    (data) => data.role !== UserRole.EMPLOYEE || data.department !== undefined,
    {
      path: ["department"],
      message: "القسم مطلوب للموظفين",
    },
  );

type CreateFormValues = z.infer<typeof CreateEmployeeSchema>;
type EditFormValues = z.infer<typeof EditEmployeeSchema>;
type EmployeeFormValues = CreateFormValues | EditFormValues;

// ── Props ─────────────────────────────────────────────────────────────────────

interface EmployeeFormProps {
  mode: "create" | "edit";
  employee?: UserDetail;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EmployeeForm({ mode, employee, onClose }: EmployeeFormProps) {
  const isEdit = mode === "edit";

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const isLoading = isCreating || isUpdating;

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(isEdit ? EditEmployeeSchema : CreateEmployeeSchema),
    defaultValues: {
      name: employee?.name ?? "",
      email: employee?.email ?? "",
      password: "",
      role: employee?.role ?? UserRole.EMPLOYEE,
      department: employee?.department ?? undefined,
    },
  });

  const selectedRole = useWatch({ control: form.control, name: "role" });
  const showDepartment = selectedRole === UserRole.EMPLOYEE;

  async function onSubmit(values: EmployeeFormValues) {
    try {
      if (isEdit && employee) {
        const body: {
          name?: string;
          email?: string;
          password?: string;
          role?: UserRole;
          department?: TaskDepartment | null;
        } = {
          name: values.name,
          email: values.email,
          role: values.role,
          department: values.department ?? null,
        };
        if (values.password && values.password.length > 0) {
          body.password = values.password;
        }
        await updateUser({ id: employee.id, body }).unwrap();
        toast.success("تم تحديث بيانات الموظف بنجاح.");
      } else {
        await createUser({
          name: values.name,
          email: values.email,
          password: values.password as string,
          role: values.role,
          department: values.department,
        }).unwrap();
        toast.success("تم إنشاء الموظف بنجاح.");
      }
      form.reset();
      onClose();
    } catch {
      toast.error(
        isEdit
          ? "فشل تحديث بيانات الموظف. يرجى المحاولة مجدداً."
          : "فشل إنشاء الموظف. يرجى المحاولة مجدداً.",
      );
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={isEdit ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
      contentClassName="sm:max-w-lg"
      footer={
        <div className="flex justify-end gap-3 pt-2">
          <ActionButton type="button" variant="outline" onClick={onClose}>
            إلغاء
          </ActionButton>
          <ActionButton type="submit" form="employee-form" disabled={isLoading}>
            {isLoading
              ? "جارٍ الحفظ..."
              : isEdit
                ? "حفظ التغييرات"
                : "إضافة الموظف"}
          </ActionButton>
        </div>
      }
    >
      <Form {...form}>
        <form
          id="employee-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم</FormLabel>
                <FormControl>
                  <FormInputControl
                    placeholder="أدخل الاسم الكامل"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>البريد الإلكتروني</FormLabel>
                <FormControl>
                  <FormInputControl
                    type="email"
                    placeholder="example@hassad.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>كلمة المرور</FormLabel>
                <FormControl>
                  <FormInputControl
                    type="password"
                    placeholder={
                      isEdit
                        ? "اتركه فارغًا للإبقاء على كلمة المرور الحالية"
                        : "8 أحرف على الأقل"
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الدور</FormLabel>
                <FormSelect onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <FormSelectTrigger>
                      <FormSelectValue placeholder="اختر الدور" />
                    </FormSelectTrigger>
                  </FormControl>
                  <FormSelectContent>
                    {Object.values(UserRole).map((role) => (
                      <FormSelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </FormSelectItem>
                    ))}
                  </FormSelectContent>
                </FormSelect>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Department — only visible for EMPLOYEE role */}
          {showDepartment && (
            <>
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>القسم</FormLabel>
                    <FormSelect
                      onValueChange={(v) =>
                        field.onChange(
                          v === "none" ? undefined : (v as TaskDepartment),
                        )
                      }
                      value={field.value ?? "none"}
                    >
                      <FormControl>
                        <FormSelectTrigger>
                          <FormSelectValue placeholder="اختر القسم" />
                        </FormSelectTrigger>
                      </FormControl>
                      <FormSelectContent>
                        <FormSelectItem value="none">بدون قسم</FormSelectItem>
                        {Object.values(TaskDepartment).map((dept) => (
                          <FormSelectItem key={dept} value={dept}>
                            {DEPARTMENT_LABELS[dept]}
                          </FormSelectItem>
                        ))}
                      </FormSelectContent>
                    </FormSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </form>
      </Form>
    </Dialog>
  );
}
