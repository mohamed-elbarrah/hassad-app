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
import { cn } from "@/lib/utils";
import { FileUploadZone } from "../components/FileUploadZone";
import type { Section4Data, UploadedFile, FormMode } from "../types";

interface Section4_CreativeProps {
  initialData?: Section4Data;
  onDataChange: (data: Section4Data) => void;
  onValid: (valid: boolean) => void;
  mode?: FormMode;
  showInfoBox?: boolean;
  showFileUpload?: boolean;
}

export function Section4_Creative({
  initialData,
  onDataChange,
  onValid,
  mode = "portal",
  showInfoBox = true,
  showFileUpload = true,
}: Section4_CreativeProps) {
  const isPortal = mode === "portal";
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
    (data: Section4Data) => {
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
      handleChange(value as Section4Data);
    });
    return () => subscription.unsubscribe();
  }, [form, handleChange]);

  return (
    <Form {...form}>
      <form className="space-y-6">
        {showInfoBox && (
          <div className={cn(
            "p-4 rounded-xl",
            isPortal ? "bg-secondary-50/50 border border-secondary-100" : "bg-muted/50 border border-border"
          )}>
            <p className={cn("text-sm font-medium", isPortal ? "text-secondary-800" : "text-foreground")}>
              💡 ليش نسأل هذا؟
            </p>
            <p className={cn("text-xs mt-1", isPortal ? "text-secondary-600" : "text-muted-foreground")}>
              نجمع موادك البصرية عشان نبدأ الشغل بسرعة
            </p>
          </div>
        )}

        <div className="space-y-4">
          <label className="block text-sm font-medium text-natural-100">
            الهوية البصرية
          </label>

          <div className={cn(
            "flex items-center justify-between p-6 rounded-2xl border",
            isPortal ? "bg-neutral-50 border-neutral-100" : "bg-muted/50 border-border"
          )}>
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
              className={cn(
                "w-14 h-8 rounded-full p-1 transition-colors duration-300",
                hasVisualIdentity ? "bg-secondary-500" : "bg-neutral-300"
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300",
                  hasVisualIdentity ? "translate-x-7" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {hasVisualIdentity && (
          <>
            {showFileUpload && (
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
            )}

            <FormField
              control={form.control}
              name="visualReferences"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm">
                    <Palette className="w-4 h-4 text-neutral-400" />
                    التوجه البصري
                  </FormLabel>
                  <div className={cn(
                    "p-6 rounded-2xl border",
                    isPortal ? "bg-gradient-to-br from-neutral-50 to-neutral-100 border-neutral-200" : "bg-muted/50 border-border"
                  )}>
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