"use client";

import { useEffect, useState } from "react";
import { Bug, Send } from "lucide-react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateIssueReportMutation, type IssueCategory, type IssueSeverity } from "@/features/communication/communicationApi";
import { communicationErrorMessage } from "@/lib/i18n";

const initialForm = { category: "BUG" as IssueCategory, severity: "NORMAL" as IssueSeverity, title: "", description: "" };

export function IssueReportDialog({ surface, open, onOpenChange }: { surface: "dashboard" | "portal"; open: boolean; onOpenChange: (open: boolean) => void }) {
  const pathname = usePathname();
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState<File[]>([]);
  const [createIssue, { isLoading }] = useCreateIssueReportMutation();

  useEffect(() => { if (!open) { setForm(initialForm); setFiles([]); } }, [open]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createIssue({ surface, input: { ...form, pagePath: pathname, files } }).unwrap();
      onOpenChange(false);
      toast.success("شكرًا لمساعدتنا على تحسين المنصة. تم استلام بلاغك وسيراجعه فريقنا.");
    } catch (error) {
      toast.error(communicationErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Bug data-icon="inline-start" />الإبلاغ عن مشكلة</DialogTitle>
          <DialogDescription>ساعدنا على تحسين تجربتك بإرسال تفاصيل المشكلة.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2"><Label htmlFor="issue-title">العنوان</Label><Input id="issue-title" value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} required maxLength={160} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2"><Label htmlFor="issue-category">التصنيف</Label><Select value={form.category} onValueChange={(value) => setForm((v) => ({ ...v, category: value as IssueCategory }))}><SelectTrigger id="issue-category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BUG">خلل أو خطأ</SelectItem><SelectItem value="PERFORMANCE">بطء أو أداء</SelectItem><SelectItem value="ACCESS">صلاحيات أو دخول</SelectItem><SelectItem value="DATA">بيانات غير صحيحة</SelectItem><SelectItem value="PAYMENT">مشكلة دفع</SelectItem><SelectItem value="OTHER">أخرى</SelectItem></SelectContent></Select></div>
            <div className="flex flex-col gap-2"><Label htmlFor="issue-severity">الأولوية</Label><Select value={form.severity} onValueChange={(value) => setForm((v) => ({ ...v, severity: value as IssueSeverity }))}><SelectTrigger id="issue-severity"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">منخفضة</SelectItem><SelectItem value="NORMAL">عادية</SelectItem><SelectItem value="HIGH">مرتفعة</SelectItem><SelectItem value="CRITICAL">حرجة</SelectItem></SelectContent></Select></div>
          </div>
          <div className="flex flex-col gap-2"><Label htmlFor="issue-description">التفاصيل</Label><Textarea id="issue-description" value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} required minLength={1} maxLength={10000} className="min-h-32" /></div>
          <div className="flex flex-col gap-2"><Label htmlFor="issue-files">المرفقات (حتى 5 ملفات)</Label><Input id="issue-files" type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))} /></div>
          <DialogFooter><Button type="submit" disabled={isLoading || !form.title.trim() || !form.description.trim()}><Send data-icon="inline-start" />{isLoading ? "جارٍ الإرسال..." : "إرسال البلاغ"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
