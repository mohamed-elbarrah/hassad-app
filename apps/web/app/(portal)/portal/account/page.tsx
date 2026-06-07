"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { useUpdateUserMutation } from "@/features/users/usersApi";
import { updateUser } from "@/features/auth/authSlice";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AccountForm } from "@/components/design-system/AccountForm";
import { Settings } from "lucide-react";
import { toast } from "sonner";

export default function PortalAccountPage() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [updateUserMutation, { isLoading }] = useUpdateUserMutation();
  const [isUploading, setIsUploading] = useState(false);

  if (!user) return null;

  const handleUpdate = async ({
    id,
    body,
  }: {
    id: string;
    body: {
      name?: string;
      email?: string;
      phoneWhatsapp?: string;
      password?: string;
      avatarUrl?: string;
    };
  }) => {
    try {
      const updatedUser = await updateUserMutation({ id, body }).unwrap();
      // Update Redux state with new user data
      dispatch(updateUser(updatedUser));
    } catch (error) {
      throw error;
    }
  };

  const handleUploadAvatar = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // For now, we'll use a placeholder URL - in production this would be a real upload endpoint
      // const response = await fetch('/api/upload', { method: 'POST', body: formData });
      // const { url } = await response.json();
      // return url;

      // Simulating upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create a temporary object URL for preview
      // In production, this should return the actual uploaded URL
      return URL.createObjectURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="الحساب الشخصي"
        description="معلومات حسابك وبيانات التواصل المرتبطة بملفك الشخصي في المنصة."
        icon={Settings}
      />

      <SurfaceCard>
        <AccountForm
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            phoneWhatsapp: user.phoneWhatsapp,
            avatarUrl: user.avatarUrl,
            role: user.role,
          }}
          onUpdate={handleUpdate}
          onUploadAvatar={handleUploadAvatar}
          isLoading={isLoading || isUploading}
        />
      </SurfaceCard>
    </div>
  );
}
