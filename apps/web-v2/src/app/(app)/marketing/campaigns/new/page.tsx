"use client";

import Link from "next/link";
import { useState } from "react";
import { CampaignPlatform, MarketingStrategyStatus } from "@hassad/shared";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showApiErrorToast, showCrmActionToast } from "@/lib/api/crm-action-toast";
import { useCreateMarketingCampaignMutation, useGetMarketingStrategiesQuery } from "@/lib/api/marketing-workspace-api";
import { useRouter, useSearchParams } from "next/navigation";

export default function NewCampaignPage() {
  const router = useRouter(); const searchParams = useSearchParams(); const taskId = searchParams.get("taskId") ?? "";
  const strategies = useGetMarketingStrategiesQuery({ status: MarketingStrategyStatus.APPROVED, taskId: taskId || undefined }); const [create] = useCreateMarketingCampaignMutation();
  const [form, setForm] = useState({ taskId, name: "", platform: CampaignPlatform.META, startDate: "", endDate: "", budgetTotal: "" });
  const submit = async () => { try { await create({ ...form, budgetTotal: Number(form.budgetTotal), endDate: form.endDate || undefined }).unwrap(); showCrmActionToast({ type: "success", title: "Campaign created", description: "The approved strategy now has a campaign." }); router.push("/marketing/campaigns"); } catch (error) { showApiErrorToast(error); } };
  return <PageScaffold title="New Campaign" description="Create a campaign only from an approved marketing strategy." actions={<Button variant="outline" nativeButton={false} render={<Link href="/marketing/campaigns" />}>Cancel</Button>}><Card><CardHeader><CardTitle>Campaign setup</CardTitle></CardHeader><CardContent className="flex flex-col gap-5"><FieldGroup><Field><FieldLabel>Approved strategy task</FieldLabel><Select value={form.taskId} onValueChange={(value) => setForm((current) => ({ ...current, taskId: value ?? "" }))}><SelectTrigger><SelectValue placeholder="Select approved strategy" /></SelectTrigger><SelectContent><SelectGroup>{(strategies.data?.data ?? []).map((strategy) => <SelectItem key={strategy.taskId} value={strategy.taskId}>{strategy.task?.title ?? strategy.taskId}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><Field><FieldLabel htmlFor="campaign-name">Campaign name</FieldLabel><Input id="campaign-name" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} /></Field><Field><FieldLabel>Platform</FieldLabel><Select value={form.platform} onValueChange={(value) => setForm((current) => ({ ...current, platform: (value ?? CampaignPlatform.META) as CampaignPlatform }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{Object.values(CampaignPlatform).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><div className="grid gap-4 sm:grid-cols-3"><Field><FieldLabel htmlFor="campaign-start">Start date</FieldLabel><Input id="campaign-start" type="date" value={form.startDate} onChange={(e) => setForm((current) => ({ ...current, startDate: e.target.value }))} /></Field><Field><FieldLabel htmlFor="campaign-end">End date</FieldLabel><Input id="campaign-end" type="date" value={form.endDate} onChange={(e) => setForm((current) => ({ ...current, endDate: e.target.value }))} /></Field><Field><FieldLabel htmlFor="campaign-budget">Total budget</FieldLabel><Input id="campaign-budget" type="number" min="0" value={form.budgetTotal} onChange={(e) => setForm((current) => ({ ...current, budgetTotal: e.target.value }))} /></Field></div></FieldGroup><Button onClick={() => void submit()} disabled={!form.taskId || !form.name || !form.startDate || !form.budgetTotal}>Create campaign</Button></CardContent></Card></PageScaffold>;
}
