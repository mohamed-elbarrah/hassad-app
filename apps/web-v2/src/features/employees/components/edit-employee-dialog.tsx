"use client";

import { SaveIcon } from "lucide-react";

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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { EmployeeFixture } from "@/lib/fixtures/first-slice";

export function EditEmployeeDialog({ employee }: { employee: EmployeeFixture }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>Edit employee</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit employee</DialogTitle>
          <DialogDescription>
            Short identity edits stay in a dialog. Sensitive access changes need a dedicated confirmation.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="employee-name">Name</FieldLabel>
              <Input id="employee-name" defaultValue={employee.name} />
            </Field>
            <Field>
              <FieldLabel htmlFor="employee-email">Email</FieldLabel>
              <Input id="employee-email" type="email" defaultValue={employee.email} />
              <FieldDescription>
                Email changes require backend session and notification handling before production.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="employee-department">Department</FieldLabel>
              <Input id="employee-department" defaultValue={employee.department} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled>
              <SaveIcon data-icon="inline-start" />
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
