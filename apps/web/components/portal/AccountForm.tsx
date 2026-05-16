"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { User, Mail, Phone, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FormInput } from "./FormInput";
import { UserInfoCard } from "./UserAvatar";

// Form schema
const AccountFormSchema = z
  .object({
    name: z.string().min(2, "الاسم مطلوب ويجب أن يكون 2 أحرف على الأقل"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    phoneWhatsapp: z
      .string()
      .min(5, "رقم الهاتف يجب أن يكون 5 أرقام على الأقل")
      .optional()
      .or(z.literal("")),
    currentPassword: z.string().optional().or(z.literal("")),
    newPassword: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      // If new password is provided, current password is required
      if (data.newPassword && data.newPassword.length > 0) {
        return data.currentPassword && data.currentPassword.length > 0;
      }
      return true;
    },
    {
      message: "كلمة المرور الحالية مطلوبة لتغيير كلمة المرور",
      path: ["currentPassword"],
    }
  )
  .refine(
    (data) => {
      // New password and confirm password must match
      if (data.newPassword && data.newPassword.length > 0) {
        return data.newPassword === data.confirmPassword;
      }
      return true;
    },
    {
      message: "كلمات المرور غير متطابقة",
      path: ["confirmPassword"],
    }
  );

type AccountFormValues = z.infer<typeof AccountFormSchema>;

interface AccountFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    phoneWhatsapp?: string | null;
    avatarUrl?: string | null;
    role: string;
  };
  onUpdate: (data: {
    id: string;
    body: {
      name?: string;
      email?: string;
      phoneWhatsapp?: string;
      password?: string;
      avatarUrl?: string;
    };
  }) => Promise<void>;
  onUploadAvatar?: (file: File) => Promise<string>;
  isLoading?: boolean;
  isUploading?: boolean;
}

export function AccountForm({
  user,
  onUpdate,
  onUploadAvatar,
  isLoading = false,
  isUploading: externalIsUploading = false,
}: AccountFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(user.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<AccountFormValues>({
    resolver: zodResolver(AccountFormSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phoneWhatsapp: user.phoneWhatsapp || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");
  const hasPasswordChange = newPassword && newPassword.length > 0;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 5 ميغابايت");
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload if handler provided
    if (onUploadAvatar) {
      setIsUploading(true);
      try {
        const avatarUrl = await onUploadAvatar(file);
        setPreviewUrl(avatarUrl);
        toast.success("تم رفع الصورة بنجاح");
      } catch (error) {
        toast.error("فشل رفع الصورة");
        setPreviewUrl(user.avatarUrl);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const onSubmit = async (values: AccountFormValues) => {
    try {
      const body: {
        name?: string;
        email?: string;
        phoneWhatsapp?: string;
        password?: string;
        avatarUrl?: string;
      } = {};

      // Only include changed fields
      if (values.name !== user.name) body.name = values.name;
      if (values.email !== user.email) body.email = values.email;
      if (
        values.phoneWhatsapp &&
        values.phoneWhatsapp !== (user.phoneWhatsapp || "")
      ) {
        body.phoneWhatsapp = values.phoneWhatsapp;
      }

      // Include password if changing
      if (hasPasswordChange) {
        body.password = values.newPassword;
      }

      // Include avatar if changed
      if (previewUrl !== user.avatarUrl) {
        body.avatarUrl = previewUrl;
      }

      await onUpdate({ id: user.id, body });

      // Reset password fields after successful update
      reset({
        name: values.name,
        email: values.email,
        phoneWhatsapp: values.phoneWhatsapp,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("تم تحديث البيانات بنجاح");
    } catch (error) {
      toast.error("فشل تحديث البيانات. يرجى المحاولة مرة أخرى.");
    }
  };

  const combinedIsUploading = isUploading || externalIsUploading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Section - Using unified UserInfoCard */}
      <div className="pb-6 border-b-[1.5px] border-portal-divider">
        <UserInfoCard
          name={user.name}
          email={user.email}
          avatarUrl={previewUrl}
          showVerified={true}
          size="lg"
          onAvatarClick={onUploadAvatar ? handleAvatarClick : undefined}
          isUploading={combinedIsUploading}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        <FormInput
          label="الاسم الكامل"
          icon={<User className="h-5 w-5 text-portal-icon" />}
          {...register("name")}
          error={errors.name?.message}
        />

        <FormInput
          label="البريد الإلكتروني"
          type="email"
          icon={<Mail className="h-5 w-5 text-portal-icon" />}
          {...register("email")}
          error={errors.email?.message}
        />

        <FormInput
          label="رقم الواتساب"
          type="tel"
          icon={<Phone className="h-5 w-5 text-portal-icon" />}
          placeholder="مثال: 966501234567"
          {...register("phoneWhatsapp")}
          error={errors.phoneWhatsapp?.message}
        />

        <Separator className="my-6" />

        {/* Password Section - Always Visible */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-secondary-500 mb-2">
            <Lock className="h-5 w-5" />
            <span className="font-medium">تغيير كلمة المرور</span>
            <span className="text-sm text-neutral-400 mr-auto">(اختياري)</span>
          </div>

          <FormInput
            label="كلمة المرور الحالية"
            type="password"
            showPasswordToggle
            placeholder="أدخل كلمة المرور الحالية"
            {...register("currentPassword")}
            error={errors.currentPassword?.message}
          />

          <FormInput
            label="كلمة المرور الجديدة"
            type="password"
            showPasswordToggle
            placeholder="8 أحرف على الأقل"
            {...register("newPassword")}
            error={errors.newPassword?.message}
          />

          <FormInput
            label="تأكيد كلمة المرور الجديدة"
            type="password"
            showPasswordToggle
            placeholder="أعد إدخال كلمة المرور الجديدة"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          disabled={isLoading || !isDirty}
          className="w-full h-12 text-base font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            "حفظ التغييرات"
          )}
        </Button>
      </div>
    </form>
  );
}
