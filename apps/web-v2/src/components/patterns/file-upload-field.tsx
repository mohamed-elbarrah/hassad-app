"use client";

import type { ChangeEvent } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function FileUploadField({
  id,
  label,
  accept,
  file,
  onChange,
}: {
  id: string;
  label: string;
  accept?: string;
  file: File | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} type="file" accept={accept} onChange={onChange} />
      {file ? <p className="text-sm text-muted-foreground">Selected: {file.name}</p> : null}
    </Field>
  );
}
