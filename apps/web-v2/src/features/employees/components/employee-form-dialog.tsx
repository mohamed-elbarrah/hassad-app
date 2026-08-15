"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserRole } from "@hassad/shared";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  EmployeeAdminRecord,
  EmployeeFormValues,
} from "@/features/employees/lib/employee-admin";
import {
  buildEmployeeFormSchema,
  departmentOptions,
  employeeRoleOptions,
  getDepartmentLabel,
  getEmployeeFormDefaults,
  getRoleLabel,
} from "@/features/employees/lib/employee-admin";
import { translateEmployeeLabel, useTranslations } from "@/lib/i18n";

type EmployeeFormDialogProps = {
  employee?: EmployeeAdminRecord;
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EmployeeFormValues) => void | Promise<void>;
};

export function EmployeeFormDialog({
  employee,
  mode,
  open,
  onOpenChange,
  onSubmit,
}: EmployeeFormDialogProps) {
  const { locale, t } = useTranslations();
  const schema = useMemo(() => buildEmployeeFormSchema(mode), [mode]);
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getEmployeeFormDefaults(employee),
  });
  const selectedRole = useWatch({
    control: form.control,
    name: "role",
  });

  useEffect(() => {
    form.reset(getEmployeeFormDefaults(employee));
  }, [employee, form, open]);

  useEffect(() => {
    if (selectedRole !== UserRole.TEAM) {
      form.setValue("department", undefined, { shouldValidate: true });
    }
  }, [form, selectedRole]);

  async function handleSubmit(values: EmployeeFormValues) {
    await onSubmit({
      ...values,
      department: values.role === UserRole.TEAM ? values.department : undefined,
    });
    onOpenChange(false);
    form.reset(getEmployeeFormDefaults());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("addEmployee") : t("editEmployee")}
          </DialogTitle>
          <DialogDescription>
            {t("employeeFormDescription")}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5"
        >
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={!!form.formState.errors.name || undefined}>
                <FieldLabel htmlFor="employee-name">{t("fullName")}</FieldLabel>
                <FieldContent>
                  <Input
                    id="employee-name"
                    aria-invalid={!!form.formState.errors.name}
                    {...form.register("name")}
                  />
                  <FieldError errors={[form.formState.errors.name]} />
                </FieldContent>
              </Field>

              <Field data-invalid={!!form.formState.errors.email || undefined}>
                <FieldLabel htmlFor="employee-email">{t("email")}</FieldLabel>
                <FieldContent>
                  <Input
                    id="employee-email"
                    type="email"
                    aria-invalid={!!form.formState.errors.email}
                    {...form.register("email")}
                  />
                  <FieldError errors={[form.formState.errors.email]} />
                </FieldContent>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={!!form.formState.errors.password || undefined}>
                <FieldLabel htmlFor="employee-password">
                  {mode === "create" ? t("password") : t("passwordReset")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="employee-password"
                    type="password"
                    aria-invalid={!!form.formState.errors.password}
                    placeholder={mode === "edit" ? t("leavePassword") : ""}
                    {...form.register("password")}
                  />
                  <FieldError errors={[form.formState.errors.password]} />
                </FieldContent>
              </Field>

              <Field data-invalid={!!form.formState.errors.phoneWhatsapp || undefined}>
                <FieldLabel htmlFor="employee-phone">{t("phoneWhatsapp")}</FieldLabel>
                <FieldContent>
                  <Input
                    id="employee-phone"
                    aria-invalid={!!form.formState.errors.phoneWhatsapp}
                    {...form.register("phoneWhatsapp")}
                  />
                  <FieldError errors={[form.formState.errors.phoneWhatsapp]} />
                </FieldContent>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={!!form.formState.errors.role || undefined}>
                <FieldLabel htmlFor="employee-role">{t("role")}</FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="employee-role"
                          aria-invalid={!!form.formState.errors.role}
                        >
                          <SelectValue placeholder={t("selectRole")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {employeeRoleOptions.map((role) => (
                              <SelectItem key={role} value={role}>
                                {translateEmployeeLabel(locale, getRoleLabel(role))}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[form.formState.errors.role]} />
                </FieldContent>
              </Field>

              {selectedRole === UserRole.TEAM ? (
                <Field data-invalid={!!form.formState.errors.department || undefined}>
                  <FieldLabel htmlFor="employee-department">{t("department")}</FieldLabel>
                  <FieldContent>
                    <Controller
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <Select
                          value={field.value ?? null}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            id="employee-department"
                            aria-invalid={!!form.formState.errors.department}
                          >
                            <SelectValue placeholder={t("selectDepartment")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {departmentOptions.map((department) => (
                                <SelectItem key={department} value={department}>
                                  {translateEmployeeLabel(locale, getDepartmentLabel(department))}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldDescription>
                      {t("teamDepartmentDescription")}
                    </FieldDescription>
                    <FieldError errors={[form.formState.errors.department]} />
                  </FieldContent>
                </Field>
              ) : (
                <Field>
                  <FieldLabel>{t("department")}</FieldLabel>
                  <FieldContent>
                    <Input value={t("notApplicable")} disabled />
                  </FieldContent>
                </Field>
              )}
            </div>

            <Field orientation="horizontal">
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                )}
              />
              <FieldContent>
                <FieldLabel>{t("activeAccount")}</FieldLabel>
                <FieldDescription>
                  {t("suspendedDescription")}
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit">
              {mode === "create" ? t("createEmployee") : t("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
