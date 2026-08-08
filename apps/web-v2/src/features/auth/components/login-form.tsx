"use client";

import Link from "next/link";
import { ArrowRightIcon, EyeIcon, LockKeyholeIcon, MailIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export function LoginForm() {
  return (
    <form className="flex flex-col gap-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <MailIcon />
            </InputGroupAddon>
            <InputGroupInput
              id="email"
              name="email"
              type="email"
              defaultValue="admin@hassad.com"
              autoComplete="email"
            />
          </InputGroup>
          <FieldDescription>Use a seeded Hassad staff account.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <LockKeyholeIcon />
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              name="password"
              type="password"
              defaultValue="password123"
              autoComplete="current-password"
            />
            <InputGroupAddon align="inline-end">
              <EyeIcon />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="remember" />
          <FieldContent>
            <FieldLabel htmlFor="remember">Keep this device signed in</FieldLabel>
            <FieldDescription>Session refresh remains cookie-based.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
      <Button nativeButton={false} render={<Link href="/admin" />}>
        Sign in
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
    </form>
  );
}
