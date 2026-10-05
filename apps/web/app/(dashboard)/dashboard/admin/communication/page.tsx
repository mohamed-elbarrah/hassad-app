"use client";

import { useMemo, useState } from "react";
import { Archive, Bug, Eye, Megaphone, Pencil, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddAdminIssueMessageMutation,
  useArchiveAnnouncementMutation,
  useAssignIssueMutation,
  useCreateAnnouncementMutation,
  useGetAdminAnnouncementsQuery,
  useGetAdminIssueQuery,
  useGetAdminIssuesQuery,
  useGetIssueAssigneesQuery,
  usePublishAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useUpdateIssueStatusMutation,
  type Announcement,
  type AnnouncementAudience,
  type AnnouncementInput,
  type IssueReport,
  type IssueStatus,
} from "@/features/communication/communicationApi";
import { communicationErrorMessage, issueCategoryLabel, issueSeverityLabel } from "@/lib/i18n";

const audienceOptions: Array<{ value: AnnouncementAudience; label: string }> = [
  { value: "ALL_STAFF", label: "كل لوحات الموظفين" },
  { value: "ADMIN", label: "الإدارة" },
  { value: "PM", label: "إدارة المشاريع" },
  { value: "SALES", label: "المبيعات" },
  { value: "MARKETING", label: "التسويق" },
  { value: "ACCOUNTANT", label: "المالية" },
  { value: "TEAM", label: "الفريق" },
  { value: "CLIENT_PORTAL", label: "بوابة العميل" },
];

const statusLabels: Record<IssueStatus, string> = {
  OPEN: "مفتوح",
  IN_PROGRESS: "قيد المعالجة",
  WAITING_FOR_USER: "بانتظار المستخدم",
  RESOLVED: "تم الحل",
  CLOSED: "مغلق",
};

const transitions: Record<IssueStatus, IssueStatus[]> = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["WAITING_FOR_USER", "RESOLVED", "CLOSED"],
  WAITING_FOR_USER: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["IN_PROGRESS", "CLOSED"],
  CLOSED: [],
};

const emptyAnnouncement: AnnouncementInput = {
  title: "",
  body: "",
  type: "INFO",
  priority: "NORMAL",
  audiences: ["ALL_STAFF"],
  allowDismissal: true,
};

export default function CommunicationCenterPage() {
  const [announcementPage, setAnnouncementPage] = useState(1);
  const [issuePage, setIssuePage] = useState(1);
  const { data: announcementsResponse, isLoading: announcementsLoading } = useGetAdminAnnouncementsQuery({ page: announcementPage });
  const { data: issuesResponse, isLoading: issuesLoading } = useGetAdminIssuesQuery({ page: issuePage });
  const announcements = announcementsResponse?.data ?? [];
  const issues = issuesResponse?.data ?? [];
  const [createAnnouncement, createState] = useCreateAnnouncementMutation();
  const [updateAnnouncement, updateState] = useUpdateAnnouncementMutation();
  const [publishAnnouncement] = usePublishAnnouncementMutation();
  const [archiveAnnouncement] = useArchiveAnnouncementMutation();
  const [updateIssueStatus] = useUpdateIssueStatusMutation();
  const [assignIssue] = useAssignIssueMutation();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementInput>(emptyAnnouncement);
  const [issueId, setIssueId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [issueMessage, setIssueMessage] = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const { data: assignees = [] } = useGetIssueAssigneesQuery(assigneeSearch || undefined);
  const [issueMessageFiles, setIssueMessageFiles] = useState<File[]>([]);
  const [addMessage, messageState] = useAddAdminIssueMessageMutation();
  const { data: issueDetail } = useGetAdminIssueQuery(issueId ?? "", { skip: !issueId });

  const isAnnouncementBusy = createState.isLoading || updateState.isLoading;
  const issueTransitions = useMemo(() => (issueDetail ? transitions[issueDetail.status] : []), [issueDetail]);

  const openCreate = () => {
    setSelectedAnnouncement(null);
    setAnnouncementForm(emptyAnnouncement);
    setEditorOpen(true);
  };

  const openEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      body: announcement.body,
      type: announcement.type,
      priority: announcement.priority,
      audiences: announcement.audiences?.map((item) => item.audience) ?? ["ALL_STAFF"],
      startsAt: announcement.startsAt ?? undefined,
      expiresAt: announcement.expiresAt ?? undefined,
      allowDismissal: announcement.allowDismissal,
      actionLabel: announcement.actionLabel ?? undefined,
      actionUrl: announcement.actionUrl ?? undefined,
    });
    setEditorOpen(true);
  };

  const submitAnnouncement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const toUtc = (value?: string) => value && value.length === 16 ? new Date(value).toISOString() : value;
    const input = { ...announcementForm, startsAt: toUtc(announcementForm.startsAt), expiresAt: toUtc(announcementForm.expiresAt) };
    try {
      if (selectedAnnouncement) {
        await updateAnnouncement({ id: selectedAnnouncement.id, input }).unwrap();
      } else {
        await createAnnouncement(input).unwrap();
      }
      toast.success("تم حفظ الإعلان كمسودة");
      setEditorOpen(false);
    } catch (error) {
      toast.error(communicationErrorMessage(error));
    }
  };

  const runAnnouncementAction = async (action: "publish" | "archive", id: string) => {
    try {
      if (action === "publish") await publishAnnouncement(id).unwrap();
      else await archiveAnnouncement(id).unwrap();
      toast.success(action === "publish" ? "تم نشر الإعلان" : "تمت أرشفة الإعلان");
    } catch (error) {
      toast.error(communicationErrorMessage(error));
    }
  };

  const changeIssueAssignment = async (assignedToId?: string) => {
    if (!issueId) return;
    try { await assignIssue({ id: issueId, assignedToId }).unwrap(); toast.success("تم تحديث المسؤول"); } catch (error) { toast.error(communicationErrorMessage(error)); }
  };

  const changeIssueStatus = async (id: string, status: IssueStatus) => {
    try {
      await updateIssueStatus({ id, status }).unwrap();
      toast.success("تم تحديث حالة البلاغ");
    } catch (error) {
      toast.error(communicationErrorMessage(error));
    }
  };

  const submitIssueMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!issueId || !issueMessage.trim()) return;
    try {
      await addMessage({ id: issueId, content: issueMessage.trim(), files: issueMessageFiles }).unwrap();
      setIssueMessage("");
      setIssueMessageFiles([]);
      toast.success("تم إرسال الرد");
    } catch (error) {
      toast.error(communicationErrorMessage(error));
    }
  };

  const toggleAudience = (audience: AnnouncementAudience, checked: boolean) => {
    setAnnouncementForm((current) => ({
      ...current,
      audiences: checked
        ? [...new Set([...current.audiences, audience])]
        : current.audiences.filter((item) => item !== audience),
    }));
  };

  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="مركز التواصل"
        description="إدارة إعلانات المنصة وبلاغات المشاكل من مكان واحد."
        icon={Megaphone}
        actions={<Button onClick={openCreate}><Plus data-icon="inline-start" />إعلان جديد</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>الإعلانات</CardTitle><CardDescription>المسودات والإعلانات المنشورة والمجدولة.</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {announcementsLoading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> : announcements.length ? announcements.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0"><p className="font-medium">{item.title}</p><p className="line-clamp-2 text-sm text-muted-foreground">{item.body}</p><Badge variant="outline" className="mt-2">{item.status}</Badge></div>
                <div className="flex shrink-0 gap-1">
                  {item.status !== "ARCHIVED" ? <Button size="icon" variant="ghost" onClick={() => openEdit(item)} aria-label="تعديل الإعلان"><Pencil data-icon="inline-start" /></Button> : null}
                  {item.status === "DRAFT" ? <Button size="sm" variant="outline" onClick={() => void runAnnouncementAction("publish", item.id)}><Send data-icon="inline-start" />نشر</Button> : null}
                  {item.status === "PUBLISHED" ? <Button size="icon" variant="ghost" onClick={() => void runAnnouncementAction("archive", item.id)} aria-label="أرشفة الإعلان"><Archive data-icon="inline-start" /></Button> : null}
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">لا توجد إعلانات بعد.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>بلاغات المشاكل</CardTitle><CardDescription>عدد البلاغات الحالية: {issuesResponse?.meta?.total ?? 0}</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {issuesLoading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> : issues.length ? issues.map((issue) => (
              <div key={issue.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0"><p className="font-medium">#{issue.reportNumber} · {issue.title}</p><p className="text-sm text-muted-foreground">{issueCategoryLabel(issue.category)} · {issueSeverityLabel(issue.severity)}</p><Badge variant="outline" className="mt-2">{statusLabels[issue.status]}</Badge></div>
                <div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" onClick={() => setIssueId(issue.id)} aria-label="عرض البلاغ"><Eye data-icon="inline-start" /></Button>{issue.status !== "CLOSED" ? <Select value={issue.status} onValueChange={(value) => void changeIssueStatus(issue.id, value as IssueStatus)}><SelectTrigger id={`issue-status-${issue.id}`} aria-label="حالة البلاغ" className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={issue.status}>{statusLabels[issue.status]}</SelectItem>{transitions[issue.status].map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}</SelectContent></Select> : null}</div>
              </div>
            )) : <div className="flex items-center gap-3 rounded-lg border p-4"><Bug className="text-muted-foreground" /><span className="text-sm text-muted-foreground">لا توجد بلاغات حالية.</span></div>}
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>الإعلانات: {announcementsResponse?.meta?.total ?? 0} · البلاغات: {issuesResponse?.meta?.total ?? 0}</span>
        <div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-1"><span>الإعلانات</span><Button variant="outline" size="sm" disabled={announcementPage <= 1} onClick={() => setAnnouncementPage((page) => Math.max(1, page - 1))}>السابق</Button><span>{announcementPage}</span><Button variant="outline" size="sm" disabled={announcementPage >= (announcementsResponse?.meta?.totalPages ?? 1)} onClick={() => setAnnouncementPage((page) => page + 1)}>التالي</Button></span><span className="inline-flex items-center gap-1"><span>البلاغات</span><Button variant="outline" size="sm" disabled={issuePage <= 1} onClick={() => setIssuePage((page) => Math.max(1, page - 1))}>السابق</Button><span>{issuePage}</span><Button variant="outline" size="sm" disabled={issuePage >= (issuesResponse?.meta?.totalPages ?? 1)} onClick={() => setIssuePage((page) => page + 1)}>التالي</Button></span></div>
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent dir="rtl" className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{selectedAnnouncement ? "تعديل الإعلان" : "إنشاء إعلان"}</DialogTitle><DialogDescription>اكتب الإعلان وحدد اللوحات التي ستراه.</DialogDescription></DialogHeader>
          <form onSubmit={submitAnnouncement} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2"><Label htmlFor="announcement-title">العنوان</Label><Input id="announcement-title" value={announcementForm.title} onChange={(event) => setAnnouncementForm((value) => ({ ...value, title: event.target.value }))} required maxLength={160} /></div>
            <div className="flex flex-col gap-2"><Label htmlFor="announcement-body">المحتوى</Label><Textarea id="announcement-body" value={announcementForm.body} onChange={(event) => setAnnouncementForm((value) => ({ ...value, body: event.target.value }))} required maxLength={5000} className="min-h-32" /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="flex flex-col gap-2"><Label htmlFor="announcement-starts">يبدأ في (اختياري)</Label><Input id="announcement-starts" type="datetime-local" value={announcementForm.startsAt?.slice(0, 16) ?? ""} onChange={(event) => setAnnouncementForm((value) => ({ ...value, startsAt: event.target.value || undefined }))} /></div><div className="flex flex-col gap-2"><Label htmlFor="announcement-expires">ينتهي في (اختياري)</Label><Input id="announcement-expires" type="datetime-local" value={announcementForm.expiresAt?.slice(0, 16) ?? ""} onChange={(event) => setAnnouncementForm((value) => ({ ...value, expiresAt: event.target.value || undefined }))} /></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="flex flex-col gap-2"><Label htmlFor="announcement-action-label">نص الإجراء (اختياري)</Label><Input id="announcement-action-label" value={announcementForm.actionLabel ?? ""} onChange={(event) => setAnnouncementForm((value) => ({ ...value, actionLabel: event.target.value || undefined }))} maxLength={80} /></div><div className="flex flex-col gap-2"><Label htmlFor="announcement-action-url">مسار الإجراء الداخلي (اختياري)</Label><Input id="announcement-action-url" value={announcementForm.actionUrl ?? ""} onChange={(event) => setAnnouncementForm((value) => ({ ...value, actionUrl: event.target.value || undefined }))} placeholder="/dashboard/..." maxLength={500} /></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="flex flex-col gap-2"><Label htmlFor="announcement-type">النوع</Label><Select value={announcementForm.type} onValueChange={(value) => setAnnouncementForm((current) => ({ ...current, type: value as AnnouncementInput["type"] }))}><SelectTrigger id="announcement-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INFO">معلومات</SelectItem><SelectItem value="SUCCESS">نجاح</SelectItem><SelectItem value="WARNING">تنبيه</SelectItem><SelectItem value="CRITICAL">حرج</SelectItem></SelectContent></Select></div><div className="flex flex-col gap-2"><Label htmlFor="announcement-priority">الأولوية</Label><Select value={announcementForm.priority} onValueChange={(value) => setAnnouncementForm((current) => ({ ...current, priority: value as AnnouncementInput["priority"] }))}><SelectTrigger id="announcement-priority"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">منخفضة</SelectItem><SelectItem value="NORMAL">عادية</SelectItem><SelectItem value="HIGH">مرتفعة</SelectItem><SelectItem value="CRITICAL">حرجة</SelectItem></SelectContent></Select></div></div>
            <fieldset className="flex flex-col gap-3"><legend className="text-sm font-medium">الجمهور</legend><div className="grid gap-3 sm:grid-cols-2">{audienceOptions.map((option) => <label key={option.value} className="flex items-center gap-2 text-sm"><Checkbox checked={announcementForm.audiences.includes(option.value)} onCheckedChange={(checked) => toggleAudience(option.value, checked === true)} />{option.label}</label>)}</div></fieldset>
            <Button type="submit" disabled={isAnnouncementBusy || !announcementForm.title.trim() || !announcementForm.body.trim() || !announcementForm.audiences.length}>{isAnnouncementBusy ? "جارٍ الحفظ..." : "حفظ كمسودة"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(issueId)} onOpenChange={(open) => { if (!open) setIssueId(null); }}>
        <DialogContent dir="rtl" className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{issueDetail ? `بلاغ #${issueDetail.reportNumber}: ${issueDetail.title}` : "تفاصيل البلاغ"}</DialogTitle><DialogDescription>راجع تفاصيل البلاغ وتواصل مع صاحبه.</DialogDescription></DialogHeader>
          {issueDetail ? <div className="flex flex-col gap-4"><div className="rounded-lg border bg-muted/30 p-4"><p className="whitespace-pre-wrap text-sm">{issueDetail.description}</p>{issueDetail.attachments?.length ? <div className="mt-3 flex flex-wrap gap-2">{issueDetail.attachments.map((attachment) => <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">{attachment.fileName}</a>)}</div> : null}<p className="mt-3 text-xs text-muted-foreground">{issueDetail.reporter?.name} · {issueDetail.pagePath ?? "لا توجد صفحة محددة"}</p></div><div className="flex flex-col gap-2"><Label htmlFor="issue-assignee-search">بحث المسؤول</Label><Input id="issue-assignee-search" value={assigneeSearch} onChange={(event) => setAssigneeSearch(event.target.value)} placeholder="الاسم أو البريد الإلكتروني" /></div><div className="flex flex-col gap-2"><Label htmlFor="issue-assignee">المسؤول</Label><Select value={issueDetail.assignedTo?.id ?? "UNASSIGNED"} onValueChange={(value) => void changeIssueAssignment(value === "UNASSIGNED" ? undefined : value)}><SelectTrigger id="issue-assignee"><SelectValue placeholder="غير معين" /></SelectTrigger><SelectContent><SelectItem value="UNASSIGNED">غير معين</SelectItem>{assignees.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectContent></Select></div><div className="flex flex-col gap-2"><Label>سجل المحادثة</Label><div className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-lg border p-3">{issueDetail.messages?.length ? issueDetail.messages.map((message) => <div key={message.id} className="rounded-md bg-muted p-2 text-sm"><p>{message.content}</p>{message.attachments?.length ? <div className="mt-2 flex flex-wrap gap-2">{message.attachments.map((attachment) => <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">{attachment.fileName}</a>)}</div> : null}<p className="mt-1 text-xs text-muted-foreground">{message.author.name}</p></div>) : <p className="text-sm text-muted-foreground">لا توجد رسائل بعد.</p>}</div></div><form onSubmit={submitIssueMessage} className="flex flex-col gap-2"><Label htmlFor="issue-message">رد الإدارة</Label><Textarea id="issue-message" value={issueMessage} onChange={(event) => setIssueMessage(event.target.value)} maxLength={10000} disabled={issueDetail.status === "CLOSED"} /><Label htmlFor="admin-issue-files">مرفقات</Label><Input id="admin-issue-files" type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={(event) => setIssueMessageFiles(Array.from(event.target.files ?? []).slice(0, 5))} /><Button type="submit" disabled={messageState.isLoading || !issueMessage.trim() || issueDetail.status === "CLOSED"}>إرسال الرد</Button>{issueDetail.status === "CLOSED" ? <p className="text-xs text-muted-foreground">لا يمكن الرد على بلاغ مغلق.</p> : null}</form><p className="text-xs text-muted-foreground">الانتقالات المتاحة: {issueTransitions.map((status) => statusLabels[status]).join("، ") || "لا توجد"}</p></div> : <p className="text-sm text-muted-foreground">جارٍ تحميل البلاغ...</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
