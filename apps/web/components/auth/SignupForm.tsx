"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { BusinessType } from "@hassad/shared";
import { useRegisterMutation } from "@/features/auth/authApi";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { AuthDivider } from "./AuthDivider";
import { AuthSocialRow } from "./AuthSocialRow";
import { AuthFooter } from "./AuthFooter";
import { useRouter } from "next/navigation";

const signupSchema = z
  .object({
    name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
    email: z.string().email("البريد الإلكتروني غير صالح"),
    phone: z.string().min(9, "رقم الجوال يجب أن يكون 9 أرقام على الأقل"),
    businessType: z.nativeEnum(BusinessType, {
      message: "يرجى اختيار نوع النشاط التجاري",
    }),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "مطعم",
  [BusinessType.CLINIC]: "عيادة",
  [BusinessType.STORE]: "متجر",
  [BusinessType.SERVICE]: "خدمة",
  [BusinessType.OTHER]: "أخرى",
};

export function SignupForm() {
  const [register, { isLoading }] = useRegisterMutation();
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      businessType: undefined,
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        businessType: values.businessType,
      }).unwrap();
      setSubmitted(true);
      toast.success("تم إنشاء حسابك بنجاح!");
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مجدداً.";
      toast.error(message);
    }
  }

  if (submitted) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-success-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-success-500">
            تم التسجيل بنجاح
          </h2>
          <p className="text-sm text-neutral-300">
            تم إنشاء حسابك. سيتواصل معك فريق المبيعات قريباً.
          </p>
        </div>
        <AuthButton
          variant="primary"
          fullWidth
          onClick={() => router.push("/login")}
        >
          تسجيل الدخول
        </AuthButton>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Name Field */}
      <AuthInput
        {...formRegister("name")}
        label="الاسم الكامل"
        icon="user"
        placeholder="محمد أحمد"
        error={errors.name?.message}
        disabled={isLoading}
      />

      {/* Email Field */}
      <AuthInput
        {...formRegister("email")}
        label="البريد الإلكتروني"
        icon="mail"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        disabled={isLoading}
      />

      {/* Phone + Business Type Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <AuthInput
          {...formRegister("phone")}
          label="رقم الجوال"
          icon="phone"
          type="tel"
          placeholder="05xxxxxxxx"
          error={errors.phone?.message}
          disabled={isLoading}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-500 text-right">
            نوع النشاط التجاري
          </label>
          <select
            {...formRegister("businessType")}
            className="w-full h-12 px-4 text-sm text-secondary-500 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20 transition-colors duration-200 text-right appearance-none"
            disabled={isLoading}
          >
            <option value="">اختر نوع النشاط</option>
            {Object.values(BusinessType).map((type) => (
              <option key={type} value={type}>
                {BUSINESS_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          {errors.businessType && (
            <p className="text-xs text-danger-500 text-right">
              {errors.businessType.message}
            </p>
          )}
        </div>
      </div>

      {/* Password Fields Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <AuthInput
          {...formRegister("password")}
          label="كلمة المرور"
          type="password"
          showPasswordToggle
          placeholder="••••••••"
          error={errors.password?.message}
          disabled={isLoading}
        />

        <AuthInput
          {...formRegister("confirmPassword")}
          label="تأكيد كلمة المرور"
          type="password"
          showPasswordToggle
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          disabled={isLoading}
        />
      </div>

      {/* Submit Button */}
      <AuthButton
        type="submit"
        variant="primary"
        fullWidth
        disabled={isLoading}
        className="mt-2"
      >
        {isLoading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
      </AuthButton>

      {/* Divider */}
      <AuthDivider text="أو" />

      {/* Social Signup */}
      <AuthSocialRow />

      {/* Footer */}
      <AuthFooter
        text="لديك حساب بالفعل؟"
        buttonText="تسجيل الدخول"
        href="/login"
      />
    </form>
  );
}
