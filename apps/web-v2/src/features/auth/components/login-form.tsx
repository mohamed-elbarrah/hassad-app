"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginDto } from "@hassad/shared";
import { useForm } from "react-hook-form";
import { ArrowRightIcon, EyeIcon, LockKeyholeIcon, MailIcon } from "lucide-react";

import { useLazyGetSessionQuery, useLoginMutation } from "@/lib/api/auth-api";
import { setSession } from "@/lib/auth/auth-slice";
import { canAccessPath, resolveSessionHome } from "@/lib/auth/auth-utils";
import { useAppDispatch } from "@/lib/store";
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
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

function getErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data &&
    "message" in error.data &&
    typeof error.data.message === "string"
  ) {
    return error.data.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "error" in error &&
    typeof error.error === "string"
  ) {
    return error.error;
  }

  return "Unable to sign in. Please verify your credentials and try again.";
}

export function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();
  const [fetchSession] = useLazyGetSessionQuery();
  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "admin@hassad.com",
      password: "password123",
      rememberMe: false,
    },
  });
  const rememberMe = watch("rememberMe");

  async function onSubmit(values: LoginDto) {
    setFormError(null);

    try {
      await login(values).unwrap();
      const session = await fetchSession().unwrap();
      const next = searchParams.get("next");
      const destination =
        next && canAccessPath(session, next) ? next : resolveSessionHome(session);

      dispatch(setSession(session));
      router.replace(destination);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <MailIcon />
            </InputGroupAddon>
            <InputGroupInput
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </InputGroup>
          <FieldDescription>
            {errors.email?.message ?? "Use a seeded Hassad staff account."}
          </FieldDescription>
        </Field>
        <Field data-invalid={Boolean(errors.password) || Boolean(formError)}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <LockKeyholeIcon />
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password) || Boolean(formError)}
              {...register("password")}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label={showPassword ? "Hide password" : "Show password"}
                size="icon-xs"
                onClick={() => setShowPassword((value) => !value)}
              >
                <EyeIcon />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>
            {errors.password?.message ?? formError ?? "Use your Hassad password."}
          </FieldDescription>
        </Field>
        <Field orientation="horizontal">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setValue("rememberMe", checked === true)}
          />
          <FieldContent>
            <FieldLabel htmlFor="remember">Keep this device signed in</FieldLabel>
            <FieldDescription>Session refresh remains cookie-based.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={isLoading}>
        Sign in
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
    </form>
  );
}
