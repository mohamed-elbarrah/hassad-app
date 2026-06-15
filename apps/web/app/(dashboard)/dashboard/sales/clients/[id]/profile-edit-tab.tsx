"use client";

import { useState, useEffect } from "react";
import type { ClientProfile, UpsertClientProfileInput } from "@hassad/shared";
import { useUpsertClientProfileMutation } from "@/features/clients/clientsApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

interface ProfileEditTabProps {
  clientId: string;
  profile: ClientProfile | null;
}

export function ProfileEditTab({ clientId, profile }: ProfileEditTabProps) {
  const [upsertProfile, { isLoading: isSaving }] =
    useUpsertClientProfileMutation();

  const [form, setForm] = useState<UpsertClientProfileInput>({
    industry: "",
    businessDescription: "",
    targetAudience: "",
    budgetRangeMin: undefined,
    budgetRangeMax: undefined,
    communicationPreference: undefined,
    preferredLanguage: "",
    timezone: "",
    preferredPlatforms: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        industry: profile.industry ?? "",
        businessDescription: profile.businessDescription ?? "",
        targetAudience: profile.targetAudience ?? "",
        budgetRangeMin: profile.budgetRangeMin ?? undefined,
        budgetRangeMax: profile.budgetRangeMax ?? undefined,
        communicationPreference:
          (profile.communicationPreference as UpsertClientProfileInput["communicationPreference"]) ??
          undefined,
        preferredLanguage: profile.preferredLanguage ?? "",
        timezone: profile.timezone ?? "",
        preferredPlatforms: profile.preferredPlatforms ?? "",
      });
    }
  }, [profile]);

  function updateField<K extends keyof UpsertClientProfileInput>(
    key: K,
    value: UpsertClientProfileInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    try {
      await upsertProfile({ id: clientId, data: form }).unwrap();
      toast.success("تم حفظ الملف التعريفي بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء حفظ الملف التعريفي");
    }
  }

  return (
    <SurfaceCard title="تعديل الملف التعريفي">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="industry">المجال</Label>
            <Input
              id="industry"
              value={form.industry ?? ""}
              onChange={(e) => updateField("industry", e.target.value || undefined)}
              placeholder="مثال: مطاعم، تجارة إلكترونية..."
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="targetAudience">الجمهور المستهدف</Label>
            <Input
              id="targetAudience"
              value={form.targetAudience ?? ""}
              onChange={(e) =>
                updateField("targetAudience", e.target.value || undefined)
              }
              placeholder="مثال: شباب 18-35، عائلات..."
            />
          </div>

          {/* Budget Range Min */}
          <div className="space-y-2">
            <Label htmlFor="budgetMin">الحد الأدنى للميزانية (ر.س)</Label>
            <Input
              id="budgetMin"
              type="number"
              value={form.budgetRangeMin ?? ""}
              onChange={(e) =>
                updateField(
                  "budgetRangeMin",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              placeholder="0"
            />
          </div>

          {/* Budget Range Max */}
          <div className="space-y-2">
            <Label htmlFor="budgetMax">الحد الأقصى للميزانية (ر.س)</Label>
            <Input
              id="budgetMax"
              type="number"
              value={form.budgetRangeMax ?? ""}
              onChange={(e) =>
                updateField(
                  "budgetRangeMax",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              placeholder="0"
            />
          </div>

          {/* Communication Preference */}
          <div className="space-y-2">
            <Label htmlFor="commPref">وسيلة التواصل المفضلة</Label>
            <Select
              value={form.communicationPreference ?? ""}
              onValueChange={(v) =>
                updateField(
                  "communicationPreference",
                  v === "" ? undefined : (v as UpsertClientProfileInput["communicationPreference"]),
                )
              }
            >
              <SelectTrigger id="commPref">
                <SelectValue placeholder="اختر وسيلة التواصل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                <SelectItem value="email">بريد إلكتروني</SelectItem>
                <SelectItem value="whatsapp">واتساب</SelectItem>
                <SelectItem value="phone">هاتف</SelectItem>
                <SelectItem value="chat">محادثة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preferred Language */}
          <div className="space-y-2">
            <Label htmlFor="prefLang">اللغة المفضلة</Label>
            <Input
              id="prefLang"
              value={form.preferredLanguage ?? ""}
              onChange={(e) =>
                updateField("preferredLanguage", e.target.value || undefined)
              }
              placeholder="مثال: العربية، الإنجليزية..."
            />
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">المنطقة الزمنية</Label>
            <Input
              id="timezone"
              value={form.timezone ?? ""}
              onChange={(e) =>
                updateField("timezone", e.target.value || undefined)
              }
              placeholder="مثال: Asia/Riyadh"
            />
          </div>

          {/* Preferred Platforms */}
          <div className="space-y-2">
            <Label htmlFor="prefPlatforms">المنصات المفضلة</Label>
            <Input
              id="prefPlatforms"
              value={form.preferredPlatforms ?? ""}
              onChange={(e) =>
                updateField("preferredPlatforms", e.target.value || undefined)
              }
              placeholder="مثال: Instagram, Twitter, TikTok..."
            />
          </div>
        </div>

        {/* Business Description — full width */}
        <div className="space-y-2">
          <Label htmlFor="bizDesc">وصف النشاط</Label>
          <Textarea
            id="bizDesc"
            value={form.businessDescription ?? ""}
            onChange={(e) =>
              updateField(
                "businessDescription",
                e.target.value || undefined,
              )
            }
            placeholder="وصف مختصر لنشاط العميل..."
            rows={4}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2 border-t">
          <ActionButton
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            icon={
              isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )
            }
          >
            {isSaving ? "جاري الحفظ..." : "حفظ الملف التعريفي"}
          </ActionButton>
        </div>
      </div>
    </SurfaceCard>
  );
}
