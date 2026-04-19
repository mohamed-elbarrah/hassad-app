"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoginSchema, UserRole } from "@hassad/shared";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLoginMutation } from "@/features/auth/authApi";
import { useAppDispatch } from "@/lib/hooks";
import { setCredentials } from "@/features/auth/authSlice";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

type LoginFormValues = z.infer<typeof LoginSchema>;

function LoginFormInner() {
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const ROLE_ROUTES: Record<UserRole, string> = {
    [UserRole.ADMIN]: "/dashboard/admin",
    [UserRole.PM]: "/dashboard/pm",
    [UserRole.SALES]: "/dashboard/sales",
    [UserRole.ACCOUNTANT]: "/dashboard/accountant",
    [UserRole.MARKETING]: "/dashboard/marketing",
    [UserRole.EMPLOYEE]: "/dashboard/designer",
    [UserRole.CLIENT]: "/portal",
  };

  async function onSubmit(values: LoginFormValues) {
    try {
      setGlobalError(null);
      const data = await login(values).unwrap();
      dispatch(setCredentials({ user: data.user }));

      const callbackUrl = searchParams.get("callbackUrl");
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push(ROLE_ROUTES[data.user.role as UserRole] ?? "/dashboard");
      }
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      setGlobalError(
        error?.data?.message || "Login failed. Please verify your credentials.",
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {globalError && (
          <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium">
            {globalError}
          </div>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <LoginFormInner />
    </Suspense>
  );
}
