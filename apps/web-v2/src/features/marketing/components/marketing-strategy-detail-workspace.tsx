"use client";

import { useState } from "react";
import { ArrowLeftIcon, DownloadIcon, SendIcon } from "lucide-react";
import Link from "next/link";
import { MarketingStrategyStatus } from "@hassad/shared";
import { FileUploadField } from "@/components/patterns/file-upload-field";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { showApiErrorToast, showCrmActionToast } from "@/lib/api/crm-action-toast";
import { useLazyDownloadMarketingStrategyQuery, useResubmitMarketingStrategyMutation, useSendMarketingStrategyMutation } from "@/lib/api/marketing-workspace-api";
import type { MarketingStrategy } from "@/lib/api/marketing-workspace-api";

const labels: Record<MarketingStrategyStatus, string> = { DRAFT: "Draft", SENT: "Sent to client", APPROVED: "Approved", REVISION_REQUESTED: "Revision requested", REJECTED: "Rejected" };
function tone(status: MarketingStrategyStatus) { if (status === MarketingStrategyStatus.APPROVED) return "success" as const; if (status === MarketingStrategyStatus.SENT) return "warning" as const; if (status === MarketingStrategyStatus.REVISION_REQUESTED) return "destructive" as const; return "neutral" as const; }

export function MarketingStrategyDetailWorkspace({ strategy }: { strategy: MarketingStrategy }) {
  const [file, setFile] = useState<File | null>(null); const [send] = useSendMarketingStrategyMutation(); const [resubmit] = useResubmitMarketingStrategyMutation(); const [download] = useLazyDownloadMarketingStrategyQuery();
  const submit = async () => { try { if (strategy.status === MarketingStrategyStatus.REVISION_REQUESTED) { if (!file) return; const body = new FormData(); body.append("file", file); await resubmit({ id: strategy.id, body }).unwrap(); } else { await send(strategy.id).unwrap(); } showCrmActionToast({ type: "success", title: strategy.status === MarketingStrategyStatus.REVISION_REQUESTED ? "Strategy resubmitted" : "Strategy sent", description: "The client approval workflow was updated." }); setFile(null); } catch (error) { showApiErrorToast(error); } };
  const openDownload = async () => { try { const result = await download(strategy.id).unwrap(); window.open(result.url, "_blank", "noopener,noreferrer"); } catch (error) { showApiErrorToast(error); } };
  return <PageScaffold title={strategy.fileName} description="Marketing strategy approval and client decision workflow." actions={<Button variant="outline" nativeButton={false} render={<Link href="/marketing/strategies" />}><ArrowLeftIcon data-icon="inline-start" />Strategies</Button>}><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.35fr)]"><Card><CardHeader><CardTitle>Strategy document</CardTitle><CardDescription>{strategy.task?.title ?? strategy.taskId}</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void openDownload()}><DownloadIcon data-icon="inline-start" />Download PDF</Button>{strategy.status === MarketingStrategyStatus.DRAFT || strategy.status === MarketingStrategyStatus.REVISION_REQUESTED ? <Button onClick={() => void submit()}><SendIcon data-icon="inline-start" />{strategy.status === MarketingStrategyStatus.REVISION_REQUESTED ? "Resubmit strategy" : "Send to client"}</Button> : null}</CardContent></Card><Card><CardHeader><CardTitle>Status</CardTitle></CardHeader><CardContent className="flex flex-col gap-4"><StatusBadge tone={tone(strategy.status)}>{labels[strategy.status]}</StatusBadge>{strategy.revisionNote ? <p className="text-sm text-muted-foreground">{strategy.revisionNote}</p> : null}{strategy.status === MarketingStrategyStatus.REVISION_REQUESTED ? <FileUploadField id="strategy-revision-file" label="Revised PDF" accept="application/pdf" file={file} onChange={(event) => setFile(event.target.files?.[0] ?? null)} /> : null}<dl className="flex flex-col gap-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Sent</dt><dd>{strategy.sentAt ? new Date(strategy.sentAt).toLocaleString() : "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Approved</dt><dd>{strategy.approvedAt ? new Date(strategy.approvedAt).toLocaleString() : "—"}</dd></div></dl></CardContent></Card></div></PageScaffold>;
}
