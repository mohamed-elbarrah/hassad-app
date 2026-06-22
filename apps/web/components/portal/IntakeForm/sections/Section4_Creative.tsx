"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Palette } from "lucide-react";
import { FileUploadZone } from "../components/FileUploadZone";

interface UploadedFile {
  key: string;
  originalName: string;
  mimeType: string;
  size?: number;
  preview?: string;
}

interface Section4FormData {
  hasVisualIdentity?: boolean;
  brandAssets?: {
    logoUrl?: string;
    brandColors?: string[];
    fonts?: string[];
    guidelinesUrl?: string;
  };
  visualReferences?: string;
  uploadedFiles?: {
    key: string;
    originalName: string;
    mimeType: string;
    size?: number;
  }[];
}

interface Section4_CreativeProps {
  initialData?: Section4FormData;
  onDataChange: (data: Section4FormData) => void;
  onValid: (valid: boolean) => void;
}

export function Section4_Creative({
  initialData,
  onDataChange,
  onValid,
}: Section4_CreativeProps) {
  const [hasVisualIdentity, setHasVisualIdentity] = useState(
    initialData?.hasVisualIdentity ?? false
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    (initialData?.uploadedFiles as UploadedFile[]) || []
  );

  const form = useForm({
    defaultValues: {
      hasVisualIdentity: initialData?.hasVisualIdentity ?? false,
      brandAssets: initialData?.brandAssets || {},
      visualReferences: initialData?.visualReferences || "",
      uploadedFiles: initialData?.uploadedFiles || [],
    },
    mode: "onChange",
  });

  const isValid = form.formState.isValid;

  useEffect(() => {
    onValid(isValid);
  }, [isValid, onValid]);

  const handleFilesUploaded = useCallback(
    (newFiles: UploadedFile[]) => {
      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
      form.setValue("uploadedFiles", updatedFiles);
    },
    [uploadedFiles, form]
  );

  const handleRemoveFile = useCallback(
    (fileKey: string) => {
      const updatedFiles = uploadedFiles.filter((f) => f.key !== fileKey);
      setUploadedFiles(updatedFiles);
      form.setValue("uploadedFiles", updatedFiles);
    },
    [uploadedFiles, form]
  );

  const handleChange = useCallback(
    (data: Section4FormData) => {
      onDataChange({
        ...data,
        hasVisualIdentity,
        uploadedFiles,
      });
    },
    [onDataChange, hasVisualIdentity, uploadedFiles]
  );

  useEffect(() => {
    const subscription = form.watch((value) => {
      handleChange(value as Section4FormData);
    });
    return () => subscription.unsubscribe();
  }, [form, handleChange]);

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="p-4 bg-secondary-50/50 border border-secondary-100 rounded-xl">
          <p className="text-sm text-secondary-800 font-medium">
            💡 ليش نسأل هذا؟
          </p>
          <p className="text-xs text-secondary-600 mt-1">
            نجمع موادك البصرية عشان نبدأ الشغل بسرعة
          </p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-natural-100">
            الهوية البصرية
          </label>

          <div className="flex items-center justify-between p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
            <div>
              <p className="font-medium text-natural-100 text-lg">
                هل عندك هوية بصرية جاهزة؟
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                (شعار، خطوط، ألوان، دليل علامة تجارية)
              </p>
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

        {hasVisualIdentity && (
          <>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-natural-100">
                رفع الملفات
              </label>
              <FileUploadZone
                onFilesUploaded={handleFilesUploaded}
                onRemoveFile={handleRemoveFile}
                uploadedFiles={uploadedFiles}
                maxFiles={5}
                maxSizeMB={10}
              />
            </div>

            <FormField
              control={form.control}
              name="visualReferences"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm">
                    <Palette className="w-4 h-4 text-neutral-400" />
                    التوجه البصري
                  </FormLabel>
                  <div className="p-6 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-2xl border border-neutral-200">
                    <p className="text-natural-100 font-medium mb-2">
                      احكي لنا عن 3 حسابات يعجبك ستايل تصاميمها
                    </p>
                    <p className="text-sm text-neutral-400 mb-4">
                      @account1, @account2, @account3
                    </p>
                    <FormInputControl
                      placeholder="@account1, @account2, @account3"
                      dir="ltr"
                      {...field}
                    />
                  </div>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
          </>
        )}

        {!hasVisualIdentity && (
          <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Palette className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-900">
                  ما عندك هوية بصرية؟
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  نقدر نساعدك في تصميم هوية بصرية كاملة لنشاطك. فريق التصميم
                  عندك بيسويك شعار واحترافي وألوان تعكس هوية براندك
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
