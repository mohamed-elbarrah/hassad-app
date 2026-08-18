"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { portalErrorMessage } from "@/lib/i18n";
import { User, Mail, Phone, Lock, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormInput } from "./FormInput";

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
    },
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
    },
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
      currentPassword?: string;
      password?: string;
      avatarUrl?: string;
    };
  }) => Promise<void>;
  onUploadAvatar?: (file: File) => Promise<string>;
  isLoading?: boolean;
  isUploading?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name[0] ?? "?").toUpperCase();
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
        toast.error(portalErrorMessage(error));
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
        currentPassword?: string;
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
        body.currentPassword = values.currentPassword;
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
      toast.error(portalErrorMessage(error));
    }
  };

  const combinedIsUploading = isUploading || externalIsUploading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Avatar Section */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onUploadAvatar ? handleAvatarClick : undefined}
            disabled={combinedIsUploading}
            className="group relative shrink-0 cursor-pointer"
          >
            <Avatar className="h-16 w-16 rounded-full">
              {previewUrl && <AvatarImage src={previewUrl} alt={user.name} />}
              <AvatarFallback className="bg-muted text-xl text-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            {onUploadAvatar && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {combinedIsUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
            )}
          </button>
          <div className="min-w-0 text-right">
            <p className="truncate text-xl font-semibold text-foreground">
              {user.name}
            </p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-5">
        <FormInput
          label="الاسم الكامل"
          icon={<User className="h-5 w-5 text-muted-foreground" />}
          {...register("name")}
          error={errors.name?.message}
        />

        <FormInput
          label="البريد الإلكتروني"
          type="email"
          icon={<Mail className="h-5 w-5 text-muted-foreground" />}
          {...register("email")}
          error={errors.email?.message}
        />

        <FormInput
          label="رقم الواتساب"
          type="tel"
          icon={<Phone className="h-5 w-5 text-muted-foreground" />}
          placeholder="مثال: 966501234567"
          {...register("phoneWhatsapp")}
          error={errors.phoneWhatsapp?.message}
        />

        <Separator className="my-6" />

        {/* Password Section - Always Visible */}
        <div className="flex flex-col gap-4">
          <div className="mb-2 flex items-center gap-2 text-foreground">
            <Lock className="h-5 w-5" />
            <span className="font-medium">تغيير كلمة المرور</span>
            <span className="mr-auto text-sm text-muted-foreground">
              (اختياري)
            </span>
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
          size="lg"
          className="w-full"
          disabled={!isDirty || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" data-icon="inline-start" />
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
