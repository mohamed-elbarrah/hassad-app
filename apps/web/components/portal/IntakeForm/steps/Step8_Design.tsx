"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FileText, Palette } from "lucide-react";

const step8Schema = z.object({
  hasVisualIdentity: z.boolean().optional(),
  visualReferenceAccounts: z.string().max(200).optional(),
});

type Step8FormData = z.infer<typeof step8Schema>;

const ASSET_OPTIONS = [
  { value: "logo_png", label: "شعار (PNG/SVG)" },
  { value: "fonts", label: "خطوط" },
  { value: "colors", label: "ألوان" },
  { value: "brand_guidelines", label: "دليل علامة تجارية" },
  { value: "product_images", label: "صور المنتج" },
];

interface Step8_DesignProps {
  onBack: () => void;
  onNext: () => void;
  updateStepData: (step: number, data: any) => void;
}

export function Step8_Design({ onBack, onNext, updateStepData }: Step8_DesignProps) {
  const [hasVisualIdentity, setHasVisualIdentity] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const form = useForm<Step8FormData>({
    resolver: zodResolver(step8Schema),
    defaultValues: {
      hasVisualIdentity: false,
      visualReferenceAccounts: "",
    },
    mode: "onChange",
  });

  const toggleAsset = useCallback((asset: string) => {
    setSelectedAssets((prev) =>
      prev.includes(asset) ? prev.filter((a) => a !== asset) : [...prev, asset]
    );
  }, []);

  const onSubmit = useCallback(
    (data: Step8FormData) => {
      updateStepData(8, {
        ...data,
        availableAssets: selectedAssets,
      });
      onNext();
    },
    [updateStepData, selectedAssets, onNext]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-natural-100">
            الهوية البصرية
          </label>

          <div className="flex items-center justify-between p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
            <div>
              <p className="font-medium text-natural-100 text-lg">هل عندك هوية بصرية جاهزة؟</p>
              <p className="text-sm text-neutral-400 mt-1">(شعار، خطوط، ألوان)</p>
            </div>
            <button
              type="button"
              onClick={() => setHasVisualIdentity(!hasVisualIdentity)}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${
                hasVisualIdentity ? "bg-secondary-500" : "bg-neutral-300"
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  hasVisualIdentity ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-lg font-semibold text-natural-100">
            المواد الجاهزة
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ASSET_OPTIONS.map((asset) => (
              <div
                key={asset.value}
                onClick={() => toggleAsset(asset.value)}
                className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 cursor-pointer"
              >
                <div className="w-5 h-5 rounded border border-neutral-300 bg-white"></div>
                <span className="text-sm font-medium">{asset.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-lg font-semibold text-natural-100">
            التوجه البصري
          </label>

          <div className="p-6 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-2xl border border-neutral-200">
            <p className="text-natural-100 font-medium mb-2">
              عطنا 3 حسابات يعجبك ستايل تصاميمها في السوشيال ميديا
            </p>
            <p className="text-sm text-neutral-400 mb-4">@account1, @account2, @account3</p>
            <FormInputControl placeholder="@account1, @account2, @account3" dir="ltr" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-6">
          <ActionButton type="button" variant="outline" onClick={onBack}>
            السابق
          </ActionButton>

          <ActionButton type="submit" variant="primary">
            حفظ والمتابعة
          </ActionButton>
        </div>
      </form>
    </Form>
  );
}

export default Step8_Design;
