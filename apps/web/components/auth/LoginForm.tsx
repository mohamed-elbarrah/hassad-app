"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserRole } from "@hassad/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLoginMutation } from "@/features/auth/authApi";
import { useAppDispatch } from "@/lib/hooks";
import { setCredentials } from "@/features/auth/authSlice";
import { authErrorMessage } from "@/lib/i18n";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { Link } from "./AuthLink";

const loginFormSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const ROLE_ROUTES: Record<UserRole, string> = {
    [UserRole.ADMIN]: "/dashboard/admin",
    [UserRole.PM]: "/dashboard/pm",
    [UserRole.SALES]: "/dashboard/sales",
    [UserRole.ACCOUNTANT]: "/dashboard/finance",
    [UserRole.MARKETING]: "/dashboard/marketing",
    [UserRole.TEAM]: "/dashboard/team",
    [UserRole.CLIENT]: "/portal",
  };

  async function onSubmit(values: LoginFormValues) {
    try {
      setGlobalError(null);
      const data = await login(values).unwrap();
      dispatch(setCredentials({ user: data.user }));

      const callbackUrl = searchParams.get("callbackUrl");
      router.push(
        callbackUrl || ROLE_ROUTES[data.user.role as UserRole] || "/dashboard",
      );
    } catch (err: unknown) {
      setGlobalError(authErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {globalError && (
        <Alert variant="destructive">
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      <AuthInput
        {...register("email")}
        id="login-email"
        label="البريد الإلكتروني"
        icon="mail"
        type="email"
        placeholder="ادخل البريد الإلكتروني هنا"
        error={errors.email?.message}
        disabled={isLoading}
        autoComplete="email"
      />

      <AuthInput
        {...register("password")}
        id="login-password"
        label="كلمة المرور"
        icon="lock"
        type="password"
        showPasswordToggle
        placeholder="••••••••"
        error={errors.password?.message}
        disabled={isLoading}
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Controller
            name="rememberMe"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="remember-me"
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
                disabled={isLoading}
                className="border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
            )}
          />
          <Label
            htmlFor="remember-me"
            className="cursor-pointer text-foreground"
          >
            تذكرني للمرة القادمة
          </Label>
        </div>
        <Link href="/forgot-password" className="h-auto px-0">
          نسيت كلمة المرور؟
        </Link>
      </div>

      <AuthButton
        type="submit"
        variant="primary"
        fullWidth
        disabled={isLoading}
      >
        {isLoading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
      </AuthButton>
    </form>
  );
}
