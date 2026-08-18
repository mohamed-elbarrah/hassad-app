"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BusinessType } from "@hassad/shared";
import { useRegisterMutation } from "@/features/auth/authApi";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { AuthDivider } from "./AuthDivider";
import { AuthSocialRow } from "./AuthSocialRow";
import { AuthFooter } from "./AuthFooter";
import { Link } from "./AuthLink";
import { authErrorMessage, authSuccessMessage } from "@/lib/i18n";

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

  const {
    register: formRegister,
    control,
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
      const result = await register({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        businessType: values.businessType,
      }).unwrap();
      setSubmitted(true);
      toast.success(authSuccessMessage(result.code));
    } catch (err: unknown) {
      toast.error(authErrorMessage(err));
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-6 py-8 text-center">
        <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 aria-hidden="true" className="size-8 text-primary" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-primary">تم التسجيل بنجاح</h2>
          <p className="text-sm text-muted-foreground">
            تم إنشاء حسابك. سيتواصل معك فريق المبيعات قريباً.
          </p>
        </div>
        <Link href="/login" className="w-full">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Name Field */}
      <AuthInput
        {...formRegister("name")}
        id="signup-name"
        label="الاسم الكامل"
        icon="user"
        placeholder="محمد أحمد"
        error={errors.name?.message}
        disabled={isLoading}
      />

      {/* Email Field */}
      <AuthInput
        {...formRegister("email")}
        id="signup-email"
        label="البريد الإلكتروني"
        icon="mail"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        disabled={isLoading}
      />

      {/* Phone + Business Type Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <AuthInput
          {...formRegister("phone")}
          id="signup-phone"
          label="رقم الجوال"
          icon="phone"
          type="tel"
          placeholder="05xxxxxxxx"
          error={errors.phone?.message}
          disabled={isLoading}
        />

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="signup-business-type"
            className="text-right text-foreground"
          >
            نوع النشاط التجاري
          </Label>
          <Controller
            name="businessType"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="signup-business-type"
                  aria-invalid={errors.businessType ? true : undefined}
                  className="h-12 rounded-xl bg-background text-right text-foreground"
                >
                  <SelectValue placeholder="اختر نوع النشاط" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(BusinessType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {BUSINESS_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.businessType && (
            <p className="text-right text-xs text-destructive">
              {errors.businessType.message}
            </p>
          )}
        </div>
      </div>

      {/* Password Fields Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <AuthInput
          {...formRegister("password")}
          id="signup-password"
          label="كلمة المرور"
          type="password"
          showPasswordToggle
          placeholder="••••••••"
          error={errors.password?.message}
          disabled={isLoading}
        />

        <AuthInput
          {...formRegister("confirmPassword")}
          id="signup-confirm-password"
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
