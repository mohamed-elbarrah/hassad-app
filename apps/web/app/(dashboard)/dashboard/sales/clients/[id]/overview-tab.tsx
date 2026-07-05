"use client";

import { useState } from "react";
import type { Client, ClientProfile } from "@hassad/shared";
import { UserRole } from "@hassad/shared";
import { ClientBriefV2 } from "@/components/client-brief";
import { ProfileEditTab } from "./profile-edit-tab";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Pencil, ArrowRight } from "lucide-react";

interface OverviewTabProps {
  client: Client;
  profile: ClientProfile | null;
}

export function OverviewTab({ client, profile }: OverviewTabProps) {
  const [isEditing, setIsEditing] = useState(false);

  // ── Edit mode ──────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-natural-100">
            تعديل الملف التعريفي
          </h2>
          <ActionButton
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(false)}
            icon={<ArrowRight className="h-4 w-4" />}
          >
            العودة للعرض
          </ActionButton>
        </div>
        <ProfileEditTab clientId={client.id} profile={profile} />
      </div>
    );
  }

  // ── View mode ──────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Edit button — top-right of the brief */}
      <div className="flex justify-end">
        <ActionButton
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
          icon={<Pencil className="h-4 w-4" />}
        >
          تعديل الملف التعريفي
        </ActionButton>
      </div>

      {/* Role-aware client profile */}
      <ClientBriefV2 client={client} profile={profile} role={UserRole.SALES} />
    </div>
  );
}
