"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { useUpdateUserMutation } from "@/features/users/usersApi";
import { updateUser } from "@/features/auth/authSlice";
import {
  useGetPortalClientProfileQuery,
  useGetPortalClientByIdQuery,
} from "@/features/portal/portalApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AccountForm } from "@/components/design-system/AccountForm";
import { PageHeader } from "@/components/common/PageHeader";
import { ProfileEditV2 } from "@/components/portal/ProfileEditV2";
import { ClientContextPanel } from "@/components/client-detail/ClientDetailPattern";
import { Settings, User, Pencil, ArrowRight } from "lucide-react";

export default function PortalAccountPage() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [updateUserMutation, { isLoading }] = useUpdateUserMutation();
  const [isUploading, setIsUploading] = useState(false);

  // Profile (business info) state
  const clientId = user?.clientId ?? "";
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useGetPortalClientProfileQuery(clientId, {
    skip: !clientId,
  });

  const {
    data: client,
    isLoading: clientLoading,
    isError: clientError,
  } = useGetPortalClientByIdQuery(clientId, {
    skip: !clientId,
  });

  if (!user) return null;

  // ── Account form handlers ────────────────────────────────────────

  const handleUpdate = async ({
    id,
    body,
  }: {
    id: string;
    body: {
      name?: string;
      email?: string;
      phoneWhatsapp?: string;
      currentPassword?: string;
      password?: string;
      avatarUrl?: string;
    };
  }) => {
    const updatedUser = await updateUserMutation({ id, body }).unwrap();
    dispatch(updateUser(updatedUser));
  };

  const handleUploadAvatar = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulating upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return URL.createObjectURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Profile (business info) helpers ─────────────────────────────

  const handleEditSuccess = () => {
    setIsEditing(false);
    refetchProfile();
  };

  const renderBusinessInfo = () => {
    if (!clientId) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 py-10">
          <p className="text-lg text-muted-foreground">
            لم يتم ربط حسابك بملف عميل. يرجى التواصل مع الإدارة.
          </p>
        </div>
      );
    }

    const isLoadingProfile = profileLoading || clientLoading;
    const isErrorProfile = profileError || clientError;

    if (isLoadingProfile) {
      return (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-48 rounded" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4 xl:col-span-3">
              <Skeleton className="h-80 rounded-2xl" />
            </div>
            <div className="flex flex-col gap-4 lg:col-span-8 xl:col-span-9">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          </div>
        </div>
      );
    }

    if (isErrorProfile || !client) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 py-10">
          <p className="text-base text-muted-foreground">
            لا توجد معلومات إضافية. يمكنك تحديث ملفك من خلال فريق المبيعات.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {isEditing ? "تعديل الملف التعريفي" : "الملف التعريفي"}
          </h2>
          {isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              data-icon="inline-start"
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              العودة للعرض
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              data-icon="inline-start"
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              تعديل الملف
            </Button>
          )}
        </div>

        {isEditing ? (
          <ProfileEditV2
            clientId={clientId}
            onCancel={() => setIsEditing(false)}
            onSuccess={handleEditSuccess}
          />
        ) : (
          <ClientContextPanel
            client={{
              ...client,
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phoneWhatsapp: user.phoneWhatsapp,
                avatarUrl: user.avatarUrl,
              },
            }}
            profile={profile ?? null}
            mode="portal"
          />
        )}
      </div>
    );
  };

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        icon={Settings}
        title="الإعدادات"
        description="إدارة بيانات حسابك والملف التعريفي لنشاطك التجاري."
      />

      <Tabs defaultValue="credentials" dir="rtl">
        <TabsList>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            بيانات الحساب
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            الملف التعريفي
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="mt-5">
          <Card>
            <CardContent className="p-5">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="mt-5">
          {renderBusinessInfo()}
        </TabsContent>
      </Tabs>
    </main>
  );
}
