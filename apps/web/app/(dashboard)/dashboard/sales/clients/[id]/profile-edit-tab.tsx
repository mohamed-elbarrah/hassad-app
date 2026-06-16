"use client";

import { useState, useEffect } from "react";
import type { ClientProfile, UpsertClientProfileInput } from "@hassad/shared";
import { useUpsertClientProfileMutation } from "@/features/clients/clientsApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Button } from "@/components/ui/button";
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
  Plus,
  Trash2,
} from "lucide-react";

interface ProfileEditTabProps {
  clientId: string;
  profile: ClientProfile | null;
}

interface CompetitorEntry {
  name: string;
  url?: string;
  notes?: string;
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
    competitors: undefined,
    brandAssets: undefined,
  });

  const [competitors, setCompetitors] = useState<CompetitorEntry[]>([]);

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
        competitors: profile.competitors
          ? (profile.competitors as CompetitorEntry[])
          : undefined,
        brandAssets: profile.brandAssets
          ? {
              logoUrl: profile.brandAssets.logoUrl ?? undefined,
              brandColors: profile.brandAssets.brandColors ?? undefined,
              fonts: profile.brandAssets.fonts ?? undefined,
              guidelinesUrl: profile.brandAssets.guidelinesUrl ?? undefined,
            }
          : undefined,
      });
      if (profile.competitors) {
        setCompetitors(profile.competitors as CompetitorEntry[]);
      }
    }
  }, [profile]);

  function updateField<K extends keyof UpsertClientProfileInput>(
    key: K,
    value: UpsertClientProfileInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addCompetitor() {
    setCompetitors((prev) => [...prev, { name: "", url: "", notes: "" }]);
  }

  function updateCompetitor(
    index: number,
    field: keyof CompetitorEntry,
    value: string,
  ) {
    setCompetitors((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value || undefined };
      return next;
    });
  }

  function removeCompetitor(index: number) {
    setCompetitors((prev) => prev.filter((_, i) => i !== index));
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
      competitors:
        competitors.length > 0
          ? competitors.filter((c) => c.name.trim())
          : undefined,
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
                  updateField(
                    "targetAudience",
                    e.target.value || undefined,
                  )
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

        {/* Preferences */}
        <section>
          <h3 className="flex items-center gap-2 text-lg font-medium mb-4 pb-3 border-b text-foreground">
            <MessageCircle className="h-5 w-5 text-primary shrink-0" />
            التفضيلات
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
              <Label htmlFor="prefLang">اللغة المفضلة</Label>
              <Input
                id="prefLang"
                value={form.preferredLanguage ?? ""}
                onChange={(e) =>
                  updateField(
                    "preferredLanguage",
                    e.target.value || undefined,
                  )
                }
                placeholder="مثال: العربية، الإنجليزية..."
              />
            </div>
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
          </div>
        </section>

        {/* Competitors */}
        <section>
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <h3 className="flex items-center gap-2 text-lg font-medium text-foreground">
              <Building2 className="h-5 w-5 text-primary shrink-0" />
              المنافسون
            </h3>
            <ActionButton
              variant="outline"
              size="sm"
              onClick={addCompetitor}
              icon={<Plus className="h-4 w-4" />}
            >
              إضافة منافس
            </ActionButton>
          </div>
          {competitors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-xl">
              لم تتم إضافة منافسين بعد. اضغط &quot;إضافة منافس&quot; للبدء.
            </p>
          ) : (
            <div className="space-y-3">
              {competitors.map((comp, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl border bg-muted/30 relative"
                >
                  <div className="space-y-2 md:col-span-1">
                    <Label className="text-xs">الاسم *</Label>
                    <Input
                      value={comp.name}
                      onChange={(e) =>
                        updateCompetitor(i, "name", e.target.value)
                      }
                      placeholder="اسم المنافس"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label className="text-xs">الرابط (اختياري)</Label>
                    <Input
                      value={comp.url ?? ""}
                      onChange={(e) =>
                        updateCompetitor(i, "url", e.target.value)
                      }
                      placeholder="https://example.com"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs">ملاحظات (اختياري)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={comp.notes ?? ""}
                        onChange={(e) =>
                          updateCompetitor(i, "notes", e.target.value)
                        }
                        placeholder="ملاحظات عن المنافس..."
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCompetitor(i)}
                        aria-label="حذف المنافس"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
