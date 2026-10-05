"use client";

import { useState } from "react";
import { Bug, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppSelector } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import { communicationErrorMessage, issueHistoryLabel } from "@/lib/i18n";
import { useAddMyIssueMessageMutation, useGetMyIssueQuery, useGetMyIssuesQuery, type IssueStatus } from "@/features/communication/communicationApi";

const labels: Record<IssueStatus, string> = { OPEN: "مفتوح", IN_PROGRESS: "قيد المعالجة", WAITING_FOR_USER: "بانتظارك", RESOLVED: "تم الحل", CLOSED: "مغلق" };

export function MyIssueReports({ surface }: { surface: "dashboard" | "portal" }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: issues = [], isLoading } = useGetMyIssuesQuery(surface, { skip: !isAuthenticated });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageFiles, setMessageFiles] = useState<File[]>([]);
  const { data: detail } = useGetMyIssueQuery({ surface, id: selectedId ?? "" }, { skip: !selectedId });
  const [addMessage, { isLoading: isSending }] = useAddMyIssueMessageMutation();

  const submitMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId || !message.trim()) return;
    try {
      await addMessage({ surface, id: selectedId, content: message.trim(), files: messageFiles }).unwrap();
      setMessage("");
      setMessageFiles([]);
      toast.success("تم إرسال رسالتك");
    } catch (error) { toast.error(communicationErrorMessage(error)); }
  };

  return <div dir="rtl" className="flex flex-col gap-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Bug data-icon="inline-start" />بلاغاتي</CardTitle><CardDescription>تابع المشاكل التي أرسلتها وتواصل مع الفريق.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">{isLoading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> : issues.length ? issues.map((issue) => <button key={issue.id} type="button" className="flex min-h-16 items-center justify-between gap-3 rounded-lg border p-3 text-start hover:bg-muted/50" onClick={() => setSelectedId(issue.id)}><span className="min-w-0"><span className="block truncate font-medium">#{issue.reportNumber} · {issue.title}</span><span className="block text-sm text-muted-foreground">{formatDate(issue.createdAt)}</span></span><Badge variant="outline">{labels[issue.status]}</Badge></button>) : <div className="flex flex-col items-center gap-3 rounded-lg border p-8 text-center"><MessageSquare className="text-muted-foreground" /><p className="text-sm text-muted-foreground">لم ترسل أي بلاغات بعد.</p></div>}</CardContent></Card><Dialog open={Boolean(selectedId)} onOpenChange={(open) => { if (!open) setSelectedId(null); }}><DialogContent dir="rtl" className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{detail?.title ?? "تفاصيل البلاغ"}</DialogTitle><DialogDescription>تفاصيل البلاغ والتحديثات من الفريق.</DialogDescription></DialogHeader>{detail ? <div className="flex flex-col gap-4"><Badge variant="outline" className="self-start">{labels[detail.status]}</Badge><p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">{detail.description}</p>{detail.attachments?.length ? <div className="flex flex-wrap gap-2">{detail.attachments.map((attachment) => <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">{attachment.fileName}</a>)}</div> : null}<div className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-lg border p-3">{detail.messages?.length ? detail.messages.map((item) => <div key={item.id} className="rounded-md bg-muted p-2 text-sm"><p>{item.content}</p>{item.attachments?.length ? <div className="mt-2 flex flex-wrap gap-2">{item.attachments.map((attachment) => <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">{attachment.fileName}</a>)}</div> : null}<p className="mt-1 text-xs text-muted-foreground">{item.author.name}</p></div>) : <p className="text-sm text-muted-foreground">لا توجد تحديثات بعد.</p>}</div><div className="flex flex-col gap-2"><Label>سجل الحالة</Label><div className="flex flex-col gap-1 rounded-lg border p-3">{detail.history?.length ? detail.history.map((item) => <p key={item.id} className="text-xs text-muted-foreground">{issueHistoryLabel(item.eventCode)} · {formatDate(item.createdAt)}</p>) : <p className="text-xs text-muted-foreground">لا يوجد سجل بعد.</p>}</div></div>{detail.status !== "CLOSED" ? <form onSubmit={submitMessage} className="flex flex-col gap-2"><Label htmlFor="my-issue-message">إضافة رسالة</Label><Textarea id="my-issue-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={10000} /><Label htmlFor="my-issue-files">مرفقات</Label><Input id="my-issue-files" type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={(event) => setMessageFiles(Array.from(event.target.files ?? []).slice(0, 5))} /><Button type="submit" disabled={isSending || !message.trim()}>إرسال</Button></form> : null}</div> : <p className="text-sm text-muted-foreground">جارٍ تحميل البلاغ...</p>}</DialogContent></Dialog></div>;
}
