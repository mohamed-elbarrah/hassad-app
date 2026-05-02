"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoginSchema, UserRole } from "@hassad/shared";
import { useLoginMutation } from "@/features/auth/authApi";
import { useAppDispatch } from "@/lib/hooks";
import { setCredentials } from "@/features/auth/authSlice";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { AuthDivider } from "./AuthDivider";
import { AuthSocialRow } from "./AuthSocialRow";
import { AuthFooter } from "./AuthFooter";
import { Link } from "./AuthLink";

// We'll define our own schema since LoginSchema from shared might not match
const loginFormSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

function LoginFormInner() {
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const ROLE_ROUTES: Record<UserRole, string> = {
    [UserRole.ADMIN]: "/dashboard/admin",
    [UserRole.PM]: "/dashboard/pm",
    [UserRole.SALES]: "/dashboard/sales",
    [UserRole.ACCOUNTANT]: "/dashboard/accountant",
    [UserRole.MARKETING]: "/dashboard/marketing",
    [UserRole.EMPLOYEE]: "/dashboard/employee",
    [UserRole.CLIENT]: "/portal",
  };

  async function onSubmit(values: LoginFormValues) {
    try {
      setGlobalError(null);
      const data = await login({
        email: values.email,
        password: values.password,
      }).unwrap();
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
        error?.data?.message || "فشل تسجيل الدخول. يرجى التحقق من بياناتك.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Global Error */}
      {globalError && (
        <div className="p-3 rounded-xl bg-danger-100/50 text-danger-500 text-sm font-medium text-center border border-danger-200">
          {globalError}
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-secondary-500 text-right">
          البريد الالكتروني
        </label>
        <div className="relative">
          <input
            {...register("email")}
            type="email"
            placeholder="ادخل البريد الالكتروني هنا"
            className="w-full h-12 px-4 pr-12 text-sm text-secondary-500 bg-white border border-neutral-200 rounded-xl placeholder:text-neutral-200 focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20 transition-colors duration-200 text-right"
            disabled={isLoading}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-5 h-5 text-neutral-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
        </div>
        {errors.email && (
          <p className="text-xs text-danger-500 text-right">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-secondary-500 text-right">
          كلمة المرور
        </label>
        <AuthInput
          {...register("password")}
          label=""
          type="password"
          showPasswordToggle
          placeholder="••••••••"
          error={errors.password?.message}
          disabled={isLoading}
        />
      </div>

      {/* Remember Me + Forgot Password Row */}
      <div className="flex items-center justify-between">
        <Link href="/forgot-password" className="text-sm">
          نسيت كلمة المرور؟
        </Link>

        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-secondary-500">
            تذكرني للمرة القادمة
          </span>
          <input
            {...register("rememberMe")}
            type="checkbox"
            className="w-4 h-4 rounded border-neutral-200 text-secondary-500 focus:ring-secondary-500/20"
          />
        </label>
      </div>

      {/* Submit Button */}
      <AuthButton
        type="submit"
        variant="primary"
        fullWidth
        disabled={isLoading}
        className="mt-2"
      >
        {isLoading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
      </AuthButton>

      {/* Divider */}
      <AuthDivider text="أو" />

      {/* Social Login */}
      <AuthSocialRow />

      {/* Footer */}
      <AuthFooter
        text="ليس لديك حساب حاليا؟"
        buttonText="انشاء حساب"
        href="/signup"
      />
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-neutral-300">
          جارٍ تحميل النموذج...
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
