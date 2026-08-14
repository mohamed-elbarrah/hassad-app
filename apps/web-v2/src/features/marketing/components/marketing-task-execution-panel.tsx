"use client";

import Link from "next/link";
import { useState } from "react";
import { FileUpIcon, MegaphoneIcon, SendIcon } from "lucide-react";
import { CampaignPlatform, MarketingStrategyStatus } from "@hassad/shared";
import { FileUploadField } from "@/components/patterns/file-upload-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/patterns/status-badge";
import { showApiErrorToast, showCrmActionToast } from "@/lib/api/crm-action-toast";
import { useCreateMarketingCampaignMutation, useCreateMarketingStrategyMutation, useGetMarketingCampaignsQuery, useGetMarketingStrategiesQuery, useSendMarketingStrategyMutation } from "@/lib/api/marketing-workspace-api";

const labels: Record<MarketingStrategyStatus, string> = { DRAFT: "Draft", SENT: "Sent to client", APPROVED: "Approved", REVISION_REQUESTED: "Revision requested", REJECTED: "Rejected" };
function strategyTone(status: MarketingStrategyStatus) { return status === MarketingStrategyStatus.APPROVED ? "success" as const : status === MarketingStrategyStatus.REVISION_REQUESTED ? "destructive" as const : status === MarketingStrategyStatus.SENT ? "warning" as const : "neutral" as const; }

export function MarketingStrategyTab({ taskId }: { taskId: string }) {
  const strategies = useGetMarketingStrategiesQuery({ taskId });
  const [create] = useCreateMarketingStrategyMutation();
  const [send] = useSendMarketingStrategyMutation();
  const [file, setFile] = useState<File | null>(null);
  const strategy = strategies.data?.data?.[0];

  const upload = async () => {
    try {
      if (!file) return;
      const body = new FormData(); body.append("file", file);
      await create({ taskId, body }).unwrap();
      showCrmActionToast({ type: "success", title: "Strategy uploaded", description: "The strategy draft is ready to review." });
      setFile(null);
    } catch (error) { showApiErrorToast(error); }
  };

  const sendStrategy = async () => {
    try {
      if (!strategy) return;
      await send(strategy.id).unwrap();
      showCrmActionToast({ type: "success", title: "Strategy sent", description: "The strategy is waiting for client approval." });
    } catch (error) { showApiErrorToast(error); }
  };

  return <Card>
    <CardHeader><CardTitle>Marketing strategy</CardTitle><CardDescription>Prepare and manage the client approval workflow for this task.</CardDescription></CardHeader>
    <CardContent className="flex flex-col gap-4">
      {strategy ? <>
        <div className="flex flex-wrap items-center gap-2"><StatusBadge tone={strategyTone(strategy.status)}>{labels[strategy.status]}</StatusBadge><Link href={`/marketing/strategies/${strategy.id}`} className="text-sm font-medium hover:underline">Open full strategy detail</Link>{strategy.status === MarketingStrategyStatus.DRAFT ? <Button size="sm" onClick={() => void sendStrategy()}><SendIcon data-icon="inline-start" />Send to client</Button> : null}</div>
        {strategy.revisionNote ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"><p className="font-medium">Client revision request</p><p className="text-muted-foreground">{strategy.revisionNote}</p></div> : null}
        <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Sent</dt><dd>{strategy.sentAt ? new Date(strategy.sentAt).toLocaleString() : "Not sent"}</dd></div><div><dt className="text-muted-foreground">Approved</dt><dd>{strategy.approvedAt ? new Date(strategy.approvedAt).toLocaleString() : "Awaiting client approval"}</dd></div></dl>
        {strategy.status === MarketingStrategyStatus.REVISION_REQUESTED ? <div className="flex flex-col gap-2"><FileUploadField id="marketing-strategy-revision" label="Upload revised PDF" accept="application/pdf" file={file} onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><Button className="self-start" disabled={!file} onClick={() => void upload()}><FileUpIcon data-icon="inline-start" />Upload revision</Button></div> : null}
      </> : <div className="flex flex-col gap-3"><p className="text-sm text-muted-foreground">No strategy has been uploaded for this task yet.</p><div className="flex flex-wrap items-center gap-2"><FileUploadField id="marketing-strategy-file" label="Marketing strategy PDF" accept="application/pdf" file={file} onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><Button disabled={!file} onClick={() => void upload()}><FileUpIcon data-icon="inline-start" />Upload strategy</Button></div></div>}
    </CardContent>
  </Card>;
}

export function MarketingCampaignsTab({ taskId }: { taskId: string }) {
  const strategies = useGetMarketingStrategiesQuery({ taskId });
  const campaigns = useGetMarketingCampaignsQuery({ taskId });
  const [createCampaign] = useCreateMarketingCampaignMutation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", platform: CampaignPlatform.META, startDate: "", endDate: "", budgetTotal: "" });
  const strategy = strategies.data?.data?.[0];
  const approved = strategy?.status === MarketingStrategyStatus.APPROVED;
  const submit = async () => { try { await createCampaign({ taskId, ...form, budgetTotal: Number(form.budgetTotal), endDate: form.endDate || undefined }).unwrap(); setOpen(false); setForm({ name: "", platform: CampaignPlatform.META, startDate: "", endDate: "", budgetTotal: "" }); showCrmActionToast({ type: "success", title: "Campaign created", description: "The campaign was created from the approved strategy." }); } catch (error) { showApiErrorToast(error); } };
  return <Card>
    <CardHeader><CardTitle>Campaigns</CardTitle><CardDescription>Manage campaigns created from this task's approved strategy.</CardDescription></CardHeader>
    <CardContent className="flex flex-col gap-4">
      {!approved ? <div className="rounded-lg border border-warning/40 bg-warning/5 p-4"><p className="font-medium">Campaign creation is locked</p><p className="text-sm text-muted-foreground">The client must approve the marketing strategy before campaigns can be created.</p>{strategy ? <StatusBadge tone={strategyTone(strategy.status)}>{labels[strategy.status]}</StatusBadge> : null}</div> : <div className="flex items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/5 p-4"><div><p className="font-medium">Strategy approved</p><p className="text-sm text-muted-foreground">Campaign creation is now available.</p></div><Button variant="outline" onClick={() => setOpen(true)}><MegaphoneIcon data-icon="inline-start" />Create campaign</Button></div>}
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Create campaign</DialogTitle><DialogDescription>Create a campaign using this client's approved marketing strategy.</DialogDescription></DialogHeader><FieldGroup><Field><FieldLabel htmlFor="task-campaign-name">Campaign name</FieldLabel><Input id="task-campaign-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field><Field><FieldLabel>Platform</FieldLabel><Select value={form.platform} onValueChange={(value) => setForm((current) => ({ ...current, platform: (value ?? CampaignPlatform.META) as CampaignPlatform }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{Object.values(CampaignPlatform).map((platform) => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><div className="grid gap-4 sm:grid-cols-3"><Field><FieldLabel htmlFor="task-campaign-start">Start date</FieldLabel><Input id="task-campaign-start" type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} /></Field><Field><FieldLabel htmlFor="task-campaign-end">End date</FieldLabel><Input id="task-campaign-end" type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} /></Field><Field><FieldLabel htmlFor="task-campaign-budget">Total budget</FieldLabel><Input id="task-campaign-budget" type="number" min="0" value={form.budgetTotal} onChange={(event) => setForm((current) => ({ ...current, budgetTotal: event.target.value }))} /></Field></div></FieldGroup><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => void submit()} disabled={!form.name || !form.startDate || !form.budgetTotal}>Create campaign</Button></DialogFooter></DialogContent></Dialog>
      {(campaigns.data?.data ?? []).length > 0 ? <div className="flex flex-col gap-2">{campaigns.data?.data.map((campaign) => <Link key={campaign.id} href={`/marketing/campaigns/${campaign.id}`} className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:border-primary/50"><div><p className="font-medium">{campaign.name}</p><p className="text-sm text-muted-foreground">{campaign.platform} · Budget {campaign.budgetTotal.toLocaleString()} · Spend {campaign.budgetSpent.toLocaleString()}</p></div><StatusBadge tone={campaign.status === "ACTIVE" ? "success" : campaign.status === "PAUSED" ? "warning" : "neutral"}>{campaign.status}</StatusBadge></Link>)}</div> : <p className="text-sm text-muted-foreground">No campaigns have been created for this task.</p>}
    </CardContent>
  </Card>;
}

export function MarketingTaskExecutionPanel({ taskId }: { taskId: string }) { return <div className="flex flex-col gap-4"><MarketingStrategyTab taskId={taskId} /><MarketingCampaignsTab taskId={taskId} /></div>; }
