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
            {mode === "create" ? "Add employee" : "Edit employee"}
          </DialogTitle>
          <DialogDescription>
            Set the employee identity and access role. Team employees require a department assignment.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5"
        >
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={!!form.formState.errors.name || undefined}>
                <FieldLabel htmlFor="employee-name">Full name</FieldLabel>
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
                <FieldLabel htmlFor="employee-email">Email</FieldLabel>
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
                  {mode === "create" ? "Password" : "Password reset"}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="employee-password"
                    type="password"
                    aria-invalid={!!form.formState.errors.password}
                    placeholder={
                      mode === "edit" ? "Leave blank to keep current password" : ""
                    }
                    {...form.register("password")}
                  />
                  <FieldError errors={[form.formState.errors.password]} />
                </FieldContent>
              </Field>

              <Field data-invalid={!!form.formState.errors.phoneWhatsapp || undefined}>
                <FieldLabel htmlFor="employee-phone">Phone / WhatsApp</FieldLabel>
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
                <FieldLabel htmlFor="employee-role">Role</FieldLabel>
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
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {employeeRoleOptions.map((role) => (
                              <SelectItem key={role} value={role}>
                                {getRoleLabel(role)}
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
                  <FieldLabel htmlFor="employee-department">Department</FieldLabel>
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
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {departmentOptions.map((department) => (
                                <SelectItem key={department} value={department}>
                                  {getDepartmentLabel(department)}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldDescription>
                      Team employees are assigned to one delivery department.
                    </FieldDescription>
                    <FieldError errors={[form.formState.errors.department]} />
                  </FieldContent>
                </Field>
              ) : (
                <Field>
                  <FieldLabel>Department</FieldLabel>
                  <FieldContent>
                    <Input value="Not applicable for this role" disabled />
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
                <FieldLabel>Active account</FieldLabel>
                <FieldDescription>
                  Suspended employees remain in the directory but lose access.
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
              Cancel
            </Button>
            <Button type="submit">
              {mode === "create" ? "Create employee" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
