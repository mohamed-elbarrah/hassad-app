"use client";

import { useState } from "react";
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";
import {
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

const announcementStatusLabels: Record<Announcement["status"], string> = {
  DRAFT: "مسودة",
  SCHEDULED: "مجدول",
  PUBLISHED: "منشور",
  ARCHIVED: "مؤرشف",
};

const audienceLabels = Object.fromEntries(audienceOptions.map(({ value, label }) => [value, label])) as Record<AnnouncementAudience, string>;

const visibleAnnouncementAudiences = (announcement: Announcement) => {
  const selected = announcement.audiences?.map(({ audience }) => audience) ?? [];
  return selected.includes("ALL_STAFF")
    ? selected.filter((audience) => audience === "ALL_STAFF" || audience === "CLIENT_PORTAL")
    : selected;
};

const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
  const [activeTab, setActiveTab] = useState("announcements");
  const [announcementPage, setAnnouncementPage] = useState(1);
  const [issuePage, setIssuePage] = useState(1);
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [issueSearch, setIssueSearch] = useState("");
  const { data: announcementsResponse, isLoading: announcementsLoading } = useGetAdminAnnouncementsQuery({ page: announcementPage, search: announcementSearch });
  const { data: issuesResponse, isLoading: issuesLoading } = useGetAdminIssuesQuery({ page: issuePage, search: issueSearch });
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
  const [assignmentIssue, setAssignmentIssue] = useState<IssueReport | null>(null);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const { data: assignees = [] } = useGetIssueAssigneesQuery(assignmentSearch || undefined);
  const { data: issueDetail, isLoading: issueDetailLoading } = useGetAdminIssueQuery(issueId ?? "", { skip: !issueId });

  const isAnnouncementBusy = createState.isLoading || updateState.isLoading;

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
      startsAt: toDateTimeLocalValue(announcement.startsAt),
      expiresAt: toDateTimeLocalValue(announcement.expiresAt),
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

  const changeIssueAssignment = async (id: string, assignedToId?: string) => {
    try { await assignIssue({ id, assignedToId }).unwrap(); toast.success("تم تحديث المسؤول"); } catch (error) { toast.error(communicationErrorMessage(error)); }
  };

  const changeIssueStatus = async (id: string, status: IssueStatus) => {
    try {
      await updateIssueStatus({ id, status }).unwrap();
      toast.success("تم تحديث حالة البلاغ");
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
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="flex flex-col gap-4">
        <TabsList className="h-auto w-full justify-start gap-1 sm:w-fit">
          <TabsTrigger value="announcements" className="min-h-11 gap-2"><Megaphone data-icon="inline-start" />الإعلانات <Badge variant="secondary">{announcementsResponse?.meta?.total ?? 0}</Badge></TabsTrigger>
          <TabsTrigger value="issues" className="min-h-11 gap-2"><Bug data-icon="inline-start" />بلاغات المشاكل <Badge variant="secondary">{issuesResponse?.meta?.total ?? 0}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="mt-0">
          <Card>
            <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div><CardTitle>الإعلانات</CardTitle><CardDescription>إدارة المحتوى والجمهور والحالة والجدولة.</CardDescription></div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input value={announcementSearch} onChange={(event) => { setAnnouncementSearch(event.target.value); setAnnouncementPage(1); }} placeholder="ابحث في الإعلانات" aria-label="ابحث في الإعلانات" className="sm:max-w-64" />
                <Button onClick={openCreate}><Plus data-icon="inline-start" />إعلان جديد</Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Table>
                <TableHeader><TableRow><TableHead>الإعلان</TableHead><TableHead>النوع</TableHead><TableHead>الأولوية</TableHead><TableHead>الجمهور</TableHead><TableHead>الحالة</TableHead><TableHead>يبدأ في</TableHead><TableHead>ينتهي في</TableHead><TableHead>الإجراءات</TableHead></TableRow></TableHeader>
                <TableBody>
                  {announcementsLoading ? <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">جارٍ تحميل الإعلانات...</TableCell></TableRow> : announcements.length ? announcements.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="min-w-56"><p className="font-medium">{item.title}</p><p className="mt-1 line-clamp-2 max-w-md text-sm text-muted-foreground">{item.body}</p></TableCell>
                      <TableCell><Badge variant={item.type === "CRITICAL" ? "destructive" : item.type === "WARNING" ? "warning" : "secondary"}>{item.type === "INFO" ? "معلومات" : item.type === "SUCCESS" ? "نجاح" : item.type === "WARNING" ? "تنبيه" : "حرج"}</Badge></TableCell>
                      <TableCell><Badge variant={item.priority === "CRITICAL" ? "destructive" : item.priority === "HIGH" ? "warning" : "outline"}>{item.priority === "LOW" ? "منخفضة" : item.priority === "NORMAL" ? "عادية" : item.priority === "HIGH" ? "مرتفعة" : "حرجة"}</Badge></TableCell>
                      <TableCell className="min-w-40"><div className="flex flex-wrap gap-1">{visibleAnnouncementAudiences(item).length ? visibleAnnouncementAudiences(item).map((audience) => <Badge key={audience} variant="outline">{audienceLabels[audience]}</Badge>) : <span className="text-muted-foreground">—</span>}</div></TableCell>
                      <TableCell><Badge variant="outline">{announcementStatusLabels[item.status]}</Badge></TableCell>
                      <TableCell className="min-w-32 text-muted-foreground">{formatDateTime(item.startsAt)}</TableCell>
                      <TableCell className="min-w-32 text-muted-foreground">{formatDateTime(item.expiresAt)}</TableCell>
                      <TableCell><div className="flex flex-wrap gap-1">
                        {item.status !== "ARCHIVED" ? <Button size="icon" variant="ghost" onClick={() => openEdit(item)} aria-label={`تعديل الإعلان ${item.title}`}><Pencil data-icon="inline-start" /></Button> : null}
                        {item.status === "DRAFT" ? <Button size="sm" variant="outline" onClick={() => void runAnnouncementAction("publish", item.id)}><Send data-icon="inline-start" />نشر</Button> : null}
                        {item.status === "PUBLISHED" ? <Button size="icon" variant="ghost" onClick={() => void runAnnouncementAction("archive", item.id)} aria-label={`أرشفة الإعلان ${item.title}`}><Archive data-icon="inline-start" /></Button> : null}
                      </div></TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">لا توجد إعلانات مطابقة.</TableCell></TableRow>}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground"><span>الإجمالي: {announcementsResponse?.meta?.total ?? 0}</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={announcementPage <= 1} onClick={() => setAnnouncementPage((page) => Math.max(1, page - 1))}>السابق</Button><span>{announcementPage} / {announcementsResponse?.meta?.totalPages ?? 1}</span><Button variant="outline" size="sm" disabled={announcementPage >= (announcementsResponse?.meta?.totalPages ?? 1)} onClick={() => setAnnouncementPage((page) => page + 1)}>التالي</Button></div></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>بلاغات المشاكل</CardTitle>
              <CardDescription>راجع بيانات البلاغ ومقدّمه والمسؤول والحالة.</CardDescription>
              <Input value={issueSearch} onChange={(event) => { setIssueSearch(event.target.value); setIssuePage(1); }} placeholder="ابحث في العنوان أو التفاصيل" aria-label="ابحث في بلاغات المشاكل" className="sm:max-w-sm" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Table>
                <TableHeader><TableRow><TableHead>البلاغ</TableHead><TableHead>مقدّم البلاغ</TableHead><TableHead>التصنيف والأولوية</TableHead><TableHead>الحالة</TableHead><TableHead>المسؤول</TableHead><TableHead>تاريخ الإرسال</TableHead><TableHead>التفاصيل</TableHead></TableRow></TableHeader>
                <TableBody>
                  {issuesLoading ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">جارٍ تحميل البلاغات...</TableCell></TableRow> : issues.length ? issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="min-w-52"><p className="font-medium">#{issue.reportNumber} · {issue.title}</p><p className="mt-1 line-clamp-2 max-w-sm text-sm text-muted-foreground">{issue.description}</p></TableCell>
                      <TableCell className="min-w-40"><p>{issue.reporter?.name ?? "غير معروف"}</p><p className="text-xs text-muted-foreground">{issue.reporter?.email ?? "—"}</p><Badge variant="outline" className="mt-1">{issue.source === "PORTAL" ? "بوابة العميل" : "لوحة الموظف"}</Badge></TableCell>
                      <TableCell><p>{issueCategoryLabel(issue.category)}</p><Badge variant={issue.severity === "CRITICAL" ? "destructive" : issue.severity === "HIGH" ? "warning" : "secondary"} className="mt-1">{issueSeverityLabel(issue.severity)}</Badge></TableCell>
                      <TableCell className="min-w-40">{issue.availableTransitions?.length ? <Select value={issue.status} onValueChange={(value) => void changeIssueStatus(issue.id, value as IssueStatus)}><SelectTrigger id={`issue-status-${issue.id}`} aria-label={`حالة البلاغ ${issue.reportNumber}`} className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value={issue.status}>{statusLabels[issue.status]}</SelectItem>{issue.availableTransitions.map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}</SelectGroup></SelectContent></Select> : <Badge variant="outline">{statusLabels[issue.status]}</Badge>}</TableCell>
                      <TableCell className="min-w-44"><div className="flex items-center gap-2"><span className="min-w-0 truncate">{issue.assignedTo?.name ?? "غير معين"}</span><Button variant="outline" size="sm" onClick={() => { setAssignmentIssue(issue); setAssignmentSearch(""); }}>تعيين</Button></div></TableCell>
                      <TableCell className="min-w-36 text-muted-foreground">{formatDateTime(issue.createdAt)}</TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => setIssueId(issue.id)} aria-label={`عرض تفاصيل البلاغ ${issue.reportNumber}`}><Eye data-icon="inline-start" /></Button></TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">لا توجد بلاغات مطابقة.</TableCell></TableRow>}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground"><span>الإجمالي: {issuesResponse?.meta?.total ?? 0}</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={issuePage <= 1} onClick={() => setIssuePage((page) => Math.max(1, page - 1))}>السابق</Button><span>{issuePage} / {issuesResponse?.meta?.totalPages ?? 1}</span><Button variant="outline" size="sm" disabled={issuePage >= (issuesResponse?.meta?.totalPages ?? 1)} onClick={() => setIssuePage((page) => page + 1)}>التالي</Button></div></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
        <DialogContent dir="rtl" className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{issueDetail ? `بلاغ #${issueDetail.reportNumber}: ${issueDetail.title}` : "تفاصيل البلاغ"}</DialogTitle>
            <DialogDescription>بيانات البلاغ ومقدّمه والمعلومات التي أرسلها.</DialogDescription>
          </DialogHeader>
          {issueDetail ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{statusLabels[issueDetail.status]}</Badge>
                <Badge variant="secondary">{issueCategoryLabel(issueDetail.category)}</Badge>
                <Badge variant={issueDetail.severity === "CRITICAL" ? "destructive" : issueDetail.severity === "HIGH" ? "warning" : "secondary"}>{issueSeverityLabel(issueDetail.severity)}</Badge>
                <Badge variant="outline">{issueDetail.source === "PORTAL" ? "بوابة العميل" : "لوحة الموظف"}</Badge>
              </div>
              <dl className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                <div><dt className="text-sm text-muted-foreground">مقدّم البلاغ</dt><dd className="mt-1 font-medium">{issueDetail.reporter?.name ?? "غير معروف"}</dd><dd className="text-sm text-muted-foreground">{issueDetail.reporter?.email ?? "—"}</dd></div>
                <div><dt className="text-sm text-muted-foreground">المسؤول عن البلاغ</dt><dd className="mt-1 font-medium">{issueDetail.assignedTo?.name ?? "غير معين"}</dd></div>
                <div><dt className="text-sm text-muted-foreground">تاريخ الإرسال</dt><dd className="mt-1">{formatDateTime(issueDetail.createdAt)}</dd></div>
                <div><dt className="text-sm text-muted-foreground">الصفحة المرتبطة</dt><dd className="mt-1 break-all">{issueDetail.pagePath || "غير محددة"}</dd></div>
              </dl>
              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">تفاصيل المشكلة</h3>
                <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm">{issueDetail.description}</p>
              </section>
              {issueDetail.attachments?.length ? <section className="flex flex-col gap-2"><h3 className="text-sm font-medium">المرفقات</h3><div className="flex flex-wrap gap-2">{issueDetail.attachments.map((attachment) => <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="rounded-md border px-3 py-2 text-sm text-primary underline">{attachment.fileName}</a>)}</div></section> : null}
            </div>
          ) : <p className="text-sm text-muted-foreground">{issueDetailLoading ? "جارٍ تحميل تفاصيل البلاغ..." : "تعذر تحميل تفاصيل البلاغ."}</p>}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(assignmentIssue)} onOpenChange={(open) => { if (!open) setAssignmentIssue(null); }}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader><DialogTitle>تعيين مسؤول للبلاغ</DialogTitle><DialogDescription>{assignmentIssue ? `بلاغ #${assignmentIssue.reportNumber}: ${assignmentIssue.title}` : "اختر المسؤول عن متابعة البلاغ."}</DialogDescription></DialogHeader>
          <div className="flex flex-col gap-3">
            <Label htmlFor="issue-assignee-search">ابحث عن مسؤول</Label>
            <Input id="issue-assignee-search" value={assignmentSearch} onChange={(event) => setAssignmentSearch(event.target.value)} placeholder="الاسم أو البريد الإلكتروني" />
            <Label htmlFor="issue-assignee-select">المسؤول</Label>
            <Select value={assignmentIssue?.assignedTo?.id ?? "UNASSIGNED"} onValueChange={(value) => { if (assignmentIssue) void changeIssueAssignment(assignmentIssue.id, value === "UNASSIGNED" ? undefined : value); setAssignmentIssue(null); }}>
              <SelectTrigger id="issue-assignee-select"><SelectValue /></SelectTrigger>
              <SelectContent><SelectGroup><SelectItem value="UNASSIGNED">غير معين</SelectItem>{assignmentIssue?.assignedTo && !assignees.some(({ id }) => id === assignmentIssue.assignedTo?.id) ? <SelectItem value={assignmentIssue.assignedTo.id}>{assignmentIssue.assignedTo.name}</SelectItem> : null}{assignees.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectGroup></SelectContent>
            </Select>
            {!assignees.length && assignmentSearch ? <p className="text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p> : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
