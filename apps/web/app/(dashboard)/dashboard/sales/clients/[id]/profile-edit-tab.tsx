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
import {
  Save,
  Loader2,
  Building2,
  Target,
  Banknote,
  MessageCircle,
  Palette,
  Globe,
  Link as LinkIcon,
  Clock,
  Crown,
  AlertCircle,
} from "lucide-react";

interface ProfileEditTabProps {
  clientId: string;
  profile: ClientProfile | null;
}

const COMM_PREF_OPTIONS = [
  { value: "email", label: "بريد إلكتروني" },
  { value: "whatsapp", label: "واتساب" },
  { value: "phone", label: "هاتف" },
  { value: "chat", label: "محادثة" },
] as const;

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
    brandAssets: undefined,
    website: "",
    instagramHandle: "",
    tiktokHandle: "",
    twitterHandle: "",
    linkedinUrl: "",
    snapchatHandle: "",
    workingHours: "",
    decisionMakerName: "",
    decisionMakerPhone: "",
    painPoints: "",
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
        brandAssets: profile.brandAssets
          ? {
              logoUrl: profile.brandAssets.logoUrl ?? undefined,
              brandColors: profile.brandAssets.brandColors ?? undefined,
              fonts: profile.brandAssets.fonts ?? undefined,
              guidelinesUrl: profile.brandAssets.guidelinesUrl ?? undefined,
            }
          : undefined,
        website: profile.website ?? "",
        instagramHandle: profile.instagramHandle ?? "",
        tiktokHandle: profile.tiktokHandle ?? "",
        twitterHandle: profile.twitterHandle ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        snapchatHandle: profile.snapchatHandle ?? "",
        workingHours: profile.workingHours ?? "",
        decisionMakerName: profile.decisionMakerName ?? "",
        decisionMakerPhone: profile.decisionMakerPhone ?? "",
        painPoints: profile.painPoints ?? "",
      });
    }
  }, [profile]);

  function updateField<K extends keyof UpsertClientProfileInput>(
    key: K,
    value: UpsertClientProfileInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateBrandAsset<
    K extends keyof NonNullable<UpsertClientProfileInput["brandAssets"]>,
  >(key: K, value: NonNullable<UpsertClientProfileInput["brandAssets"]>[K]) {
    setForm((prev) => ({
      ...prev,
      brandAssets: { ...(prev.brandAssets ?? {}), [key]: value },
    }));
  }

  async function handleSave() {
    const payload: UpsertClientProfileInput = {
      ...form,
      website: form.website || undefined,
      instagramHandle: form.instagramHandle || undefined,
      tiktokHandle: form.tiktokHandle || undefined,
      twitterHandle: form.twitterHandle || undefined,
      linkedinUrl: form.linkedinUrl || undefined,
      snapchatHandle: form.snapchatHandle || undefined,
      workingHours: form.workingHours || undefined,
      decisionMakerName: form.decisionMakerName || undefined,
      decisionMakerPhone: form.decisionMakerPhone || undefined,
      painPoints: form.painPoints || undefined,
    };
    try {
      await upsertProfile({ id: clientId, data: payload }).unwrap();
      toast.success("تم حفظ الملف التعريفي بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء حفظ الملف التعريفي");
    }
  }

  return (
    <SurfaceCard>
      <div className="space-y-8">
        {/* Business Info */}
        <section>
          <h3 className="flex items-center gap-2 text-lg font-medium mb-4 pb-3 border-b text-foreground">
            <Building2 className="h-5 w-5 text-primary shrink-0" />
            معلومات النشاط
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">المجال</Label>
              <Input
                id="industry"
                value={form.industry ?? ""}
                onChange={(e) =>
                  updateField("industry", e.target.value || undefined)
                }
                placeholder="مثال: مطاعم، تجارة إلكترونية..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAudience">
                <Target className="h-3.5 w-3.5 inline me-1 text-muted-foreground" />
                الجمهور المستهدف
              </Label>
              <Input
                id="targetAudience"
                value={form.targetAudience ?? ""}
                onChange={(e) =>
                  updateField("targetAudience", e.target.value || undefined)
                }
                placeholder="مثال: شباب 18-35، عائلات..."
              />
            </div>
            <div className="md:col-span-2 space-y-2">
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
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* Budget */}
        <section>
          <h3 className="flex items-center gap-2 text-lg font-medium mb-4 pb-3 border-b text-foreground">
            <Banknote className="h-5 w-5 text-primary shrink-0" />
            الميزانية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetMin">الحد الأدنى (ر.س)</Label>
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
            <div className="space-y-2">
              <Label htmlFor="budgetMax">الحد الأقصى (ر.س)</Label>
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
          </div>
        </section>

        {/* Communication Preferences */}
        <section>
          <h3 className="flex items-center gap-2 text-lg font-medium mb-4 pb-3 border-b text-foreground">
            <MessageCircle className="h-5 w-5 text-primary shrink-0" />
            تفضيلات التواصل
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commPref">وسيلة التواصل المفضلة</Label>
              <Select
                value={form.communicationPreference ?? "none"}
                onValueChange={(v) =>
                  updateField(
                    "communicationPreference",
                    v === "none"
                      ? undefined
                      : (v as UpsertClientProfileInput["communicationPreference"]),
                  )
                }
              >
                <SelectTrigger id="commPref">
                  <SelectValue placeholder="اختر وسيلة التواصل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون تفضيل</SelectItem>
                  {COMM_PREF_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prefPlatforms">المنصات المفضلة</Label>
              <Input
                id="prefPlatforms"
                value={form.preferredPlatforms ?? ""}
                onChange={(e) =>
                  updateField(
                    "preferredPlatforms",
                    e.target.value || undefined,
                  )
                }
                placeholder="مثال: Instagram, Twitter, TikTok..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workingHours">
                <Clock className="h-3.5 w-3.5 inline me-1 text-muted-foreground" />
                أوقات العمل المفضلة للتواصل
              </Label>
              <Input
                id="workingHours"
                value={form.workingHours ?? ""}
                onChange={(e) =>
                  updateField("workingHours", e.target.value || undefined)
                }
                placeholder="مثال: 9:00 ص – 12:00 م"
              />
            </div>
          </div>
        </section>

        {/* Digital Presence */}
        <section>
          <h3 className="flex items-center gap-2 text-lg font-medium mb-4 pb-3 border-b text-foreground">
            <Globe className="h-5 w-5 text-primary shrink-0" />
            ال presence الرقمية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">
                <LinkIcon className="h-3.5 w-3.5 inline me-1 text-muted-foreground" />
                الموقع الإلكتروني
              </Label>
              <Input
                id="website"
                dir="ltr"
                value={form.website ?? ""}
                onChange={(e) =>
                  updateField("website", e.target.value || undefined)
                }
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagramHandle">
                <Globe className="h-3.5 w-3.5 inline me-1 text-muted-foreground" />
                انستغرام
              </Label>
              <Input
                id="instagramHandle"
                dir="ltr"
                value={form.instagramHandle ?? ""}
                onChange={(e) =>
                  updateField("instagramHandle", e.target.value || undefined)
                }
                placeholder="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktokHandle">تيك توك</Label>
              <Input
                id="tiktokHandle"
                dir="ltr"
                value={form.tiktokHandle ?? ""}
                onChange={(e) =>
                  updateField("tiktokHandle", e.target.value || undefined)
                }
                placeholder="@username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitterHandle">تويتر / إكس</Label>
              <Input
                id="twitterHandle"
                dir="ltr"
                value={form.twitterHandle ?? ""}
                onChange={(e) =>
                  updateField("twitterHandle", e.target.value || undefined)
                }
                placeholder="@username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">لينكد إن</Label>
              <Input
                id="linkedinUrl"
                dir="ltr"
                value={form.linkedinUrl ?? ""}
                onChange={(e) =>
                  updateField("linkedinUrl", e.target.value || undefined)
                }
                placeholder="https://linkedin.com/company/..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="snapchatHandle">سناب شات</Label>
              <Input
                id="snapchatHandle"
                dir="ltr"
                value={form.snapchatHandle ?? ""}
                onChange={(e) =>
                  updateField("snapchatHandle", e.target.value || undefined)
                }
                placeholder="username"
              />
            </div>
          </div>
        </section>

        {/* Decision Maker */}
        <section>
          <h3 className="flex items-center gap-2 text-lg font-medium mb-4 pb-3 border-b text-foreground">
            <Crown className="h-5 w-5 text-primary shrink-0" />
            صانع القرار
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="decisionMakerName">الاسم</Label>
              <Input
                id="decisionMakerName"
                value={form.decisionMakerName ?? ""}
                onChange={(e) =>
                  updateField(
                    "decisionMakerName",
                    e.target.value || undefined,
                  )
                }
                placeholder="اسم صانع القرار"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decisionMakerPhone">الهاتف</Label>
              <Input
                id="decisionMakerPhone"
                dir="ltr"
                value={form.decisionMakerPhone ?? ""}
                onChange={(e) =>
                  updateField(
                    "decisionMakerPhone",
                    e.target.value || undefined,
                  )
                }
                placeholder="05xxxxxxxx"
              />
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section>
          <h3 className="flex items-center gap-2 text-lg font-medium mb-4 pb-3 border-b text-foreground">
            <AlertCircle className="h-5 w-5 text-primary shrink-0" />
            نقاط الألم والتحديات
          </h3>
          <div className="space-y-2">
            <Textarea
              value={form.painPoints ?? ""}
              onChange={(e) =>
                updateField("painPoints", e.target.value || undefined)
              }
              placeholder="ما هي التحديات التي يواجهها العميل حالياً؟"
              rows={4}
            />
          </div>
        </section>

        {/* Brand Assets */}
        <section>
          <h3 className="flex items-center gap-2 text-lg font-medium mb-4 pb-3 border-b text-foreground">
            <Palette className="h-5 w-5 text-primary shrink-0" />
            الأصول البصرية للعلامة التجارية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">رابط الشعار</Label>
              <Input
                id="logoUrl"
                value={form.brandAssets?.logoUrl ?? ""}
                onChange={(e) =>
                  updateBrandAsset(
                    "logoUrl",
                    e.target.value || undefined,
                  )
                }
                placeholder="https://example.com/logo.png"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandColors">
                ألوان العلامة التجارية
              </Label>
              <Input
                id="brandColors"
                value={
                  (form.brandAssets?.brandColors ?? []).join(", ")
                }
                onChange={(e) =>
                  updateBrandAsset(
                    "brandColors",
                    e.target.value
                      ? e.target.value
                          .split(",")
                          .map((c) => c.trim())
                          .filter(Boolean)
                      : undefined,
                  )
                }
                placeholder="#FF0000, #00FF00, #0000FF"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fonts">الخطوط المستخدمة</Label>
              <Input
                id="fonts"
                value={(form.brandAssets?.fonts ?? []).join(", ")}
                onChange={(e) =>
                  updateBrandAsset(
                    "fonts",
                    e.target.value
                      ? e.target.value
                          .split(",")
                          .map((f) => f.trim())
                          .filter(Boolean)
                      : undefined,
                  )
                }
                placeholder="Cairo, Inter, Tajawal..."
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guidelinesUrl">
                رابط دليل الهوية البصرية
              </Label>
              <Input
                id="guidelinesUrl"
                value={form.brandAssets?.guidelinesUrl ?? ""}
                onChange={(e) =>
                  updateBrandAsset(
                    "guidelinesUrl",
                    e.target.value || undefined,
                  )
                }
                placeholder="https://example.com/brand-guidelines"
                dir="ltr"
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            جميع الحقول اختيارية
          </p>
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
