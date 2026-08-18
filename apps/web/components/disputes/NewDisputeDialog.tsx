"use client";

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DisputeCategory, CreateDisputeInput } from "@hassad/shared";
import { DisputeCategory as DisputeCategoryEnum } from "@hassad/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DisputeCategoryIcon } from "./DisputeCategoryIcon";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { useGetPortalProjectsQuery } from "@/features/portal/portalApi";

interface NewDisputeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDisputeInput, files?: File[]) => void;
  isLoading?: boolean;
  projectId?: string;
  projectName?: string;
}

const CATEGORIES: { value: DisputeCategory; label: string }[] = [
  { value: DisputeCategoryEnum.DELAY, label: "تأخير في المشروع" },
  { value: DisputeCategoryEnum.QUALITY, label: "جودة التسليمات" },
  { value: DisputeCategoryEnum.COMMUNICATION, label: "مشكلة في التواصل" },
  { value: DisputeCategoryEnum.BUDGET, label: "ميزانية" },
  { value: DisputeCategoryEnum.SCOPE, label: "نطاق العمل" },
  { value: DisputeCategoryEnum.ATTITUDE, label: "تعامل" },
  { value: DisputeCategoryEnum.OTHER, label: "أخرى" },
];

export function NewDisputeDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  projectId: initialProjectId,
  projectName: initialProjectName,
}: NewDisputeDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(initialProjectId);
  const [category, setCategory] = useState<DisputeCategory | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch client projects for selection (only if no initial projectId)
  const { data: projectsData, isLoading: isLoadingProjects } =
    useGetPortalProjectsQuery(undefined, { skip: !!initialProjectId });

  const projects = projectsData?.data || [];
  const showProjectSelector = !initialProjectId;

  // Reset selected project when dialog opens with initial project
  useEffect(() => {
    if (isOpen && initialProjectId) {
      setSelectedProjectId(initialProjectId);
    }
  }, [isOpen, initialProjectId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (showProjectSelector && !selectedProjectId) {
      newErrors.project = "الرجاء اختيار المشروع";
    }
    if (!category) {
      newErrors.category = "الرجاء اختيار نوع النزاع";
    }
    if (title.trim().length < 5) {
      newErrors.title = "العنوان يجب أن يكون 5 أحرف على الأقل";
    }
    if (description.trim().length < 20) {
      newErrors.description = "الوصف يجب أن يكون 20 حرف على الأقل";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !category || !selectedProjectId) return;

    onSubmit(
      {
        projectId: selectedProjectId,
        category,
        title: title.trim(),
        description: description.trim(),
      },
      files.length > 0 ? files : undefined,
    );
  };

  const handleClose = () => {
    if (isLoading) return;
    if (showProjectSelector) {
      setSelectedProjectId(undefined);
    }
    setCategory(null);
    setTitle("");
    setDescription("");
    setFiles([]);
    setErrors({});
    onClose();
  };

  const selectedProjectName =
    initialProjectName ||
    projects.find((p) => p.id === selectedProjectId)?.name;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden bg-background p-0 sm:max-h-[calc(100dvh-4rem)]"
        dir="rtl"
        showClose={false}
        // Prevent accidental form loss while a request is in-flight
        // (audit issue #10). Always-on while loading; while idle we
        // still want a confirmation, but we keep it lightweight via
        // the explicit "Cancel" button and disable outside-click on
        // Escape as well so the user can't lose typed content by
        // hitting Esc by mistake.
        onInteractOutside={(e) => {
          if (isLoading) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isLoading) e.preventDefault();
        }}
      >
        <DialogHeader className="shrink-0 border-b bg-muted/40 p-6 pb-4 text-center sm:text-center">
          <DialogTitle className="text-xl font-semibold text-foreground">
            فتح تذكرة نزاع جديدة
          </DialogTitle>
          {selectedProjectName && !showProjectSelector && (
            <DialogDescription className="text-muted-foreground">
              المشروع: {selectedProjectName}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
          {/* Project Selection (only if no initial projectId) */}
          {showProjectSelector && (
            <div className="flex flex-col gap-2">
              <label htmlFor="dispute-project" className="text-sm font-medium text-foreground">
                المشروع *
              </label>
              {isLoadingProjects ? (
                <Skeleton className="h-10 w-full rounded-xl" />
              ) : projects.length === 0 ? (
                <p className="text-sm text-danger-600">
                  لا توجد مشاريع متاحة. يجب أن يكون لديك مشروع نشط لفتح تذكرة.
                </p>
              ) : (
                <>
                  <Select
                    value={selectedProjectId || ""}
                    onValueChange={(value) => {
                      setSelectedProjectId(value);
                      setErrors((e) => ({ ...e, project: "" }));
                    }}
                  >
                    <SelectTrigger id="dispute-project" className="w-full" aria-invalid={!!errors.project}>
                      <SelectValue placeholder="اختر المشروع..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.project && (
                    <p className="flex items-center gap-1 text-xs text-danger-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.project}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Category Selection */}
          <div className="flex flex-col gap-3">
            <span id="dispute-category-label" className="text-sm font-medium text-foreground">
              نوع النزاع *
            </span>
            <RadioGroup
              value={category ?? ""}
              onValueChange={(value) => {
                setCategory(value as DisputeCategory);
                setErrors((e) => ({ ...e, category: "" }));
              }}
              disabled={isLoading}
              aria-labelledby="dispute-category-label"
              aria-invalid={!!errors.category}
              className="grid grid-cols-2 gap-2"
            >
              {CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  htmlFor={`dispute-category-${cat.value}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border p-3 text-right transition-colors hover:border-primary/40",
                    category === cat.value && "border-primary bg-primary/10",
                    isLoading && "cursor-not-allowed opacity-50",
                  )}
                >
                  <RadioGroupItem
                    id={`dispute-category-${cat.value}`}
                    value={cat.value}
                    className="sr-only"
                  />
                  <DisputeCategoryIcon category={cat.value} size="sm" />
                  <span className="text-sm text-foreground">{cat.label}</span>
                </label>
              ))}
            </RadioGroup>
            {errors.category && (
              <p className="flex items-center gap-1 text-xs text-danger-600">
                <AlertCircle className="h-3 w-3" />
                {errors.category}
              </p>
            )}
          </div>

          {/* Title Input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="dispute-title" className="text-sm font-medium text-foreground">
              عنوان النزاع *
            </label>
            <Input
              id="dispute-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((e) => ({ ...e, title: "" }));
              }}
              placeholder="أدخل عنوان مختصر للمشكلة..."
              disabled={isLoading}
              aria-invalid={!!errors.title}
              className={cn(errors.title ? "border-destructive" : undefined)}
            />
            {errors.title && (
              <p className="flex items-center gap-1 text-xs text-danger-600">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description Input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="dispute-description" className="text-sm font-medium text-foreground">
              تفاصيل النزاع *
            </label>
            <Textarea
              id="dispute-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((e) => ({ ...e, description: "" }));
              }}
              placeholder="اشرح المشكلة بالتفصيل..."
              disabled={isLoading}
              rows={4}
              aria-invalid={!!errors.description}
              className={cn("resize-none", errors.description ? "border-destructive" : undefined)}
            />
            {errors.description && (
              <p className="flex items-center gap-1 text-xs text-danger-600">
                <AlertCircle className="h-3 w-3" />
                {errors.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              يجب أن يكون الوصف 20 حرف على الأقل
            </p>
          </div>

          {/* File Attachments */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              المرفقات (اختياري)
            </label>
            <FileDropzone
              files={files}
              onFilesChange={setFiles}
              maxFiles={5}
              maxSizeMB={10}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-row-reverse gap-3 border-t bg-muted/40 p-4 sm:justify-start">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="px-6"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !category ||
              !title ||
              !description ||
              (showProjectSelector && !selectedProjectId)
            }
            className="px-6"
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                جاري الإرسال...
              </>
            ) : (
              "إرسال التذكرة"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
