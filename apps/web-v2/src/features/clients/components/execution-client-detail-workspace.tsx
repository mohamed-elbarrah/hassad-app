"use client";

import Link from "next/link";
import { ArrowLeftIcon, Building2Icon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientBusinessSectionContent } from "@/features/clients/components/client-business-section-content";
import { getClientBusinessSections, type ClientBusinessProfile } from "@/features/clients/lib/client-detail";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/patterns/status-badge";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import type { ExecutionClientView } from "@/lib/api/execution-clients-api";

function InfoRow({ label, content }: { label: string; content: string }) { return <div className="flex flex-col gap-1"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-medium">{content}</dd></div>; }

export function ExecutionClientDetailWorkspace({ view, mode }: { view: ExecutionClientView; mode: "team" | "marketing" }) {
  const backHref = mode === "marketing" ? "/marketing" : "/team";
  const profile = view.profile;
  const businessSections = getClientBusinessSections((profile ?? {}) as ClientBusinessProfile);
  return <PageScaffold title={view.client.companyName ?? view.client.businessName ?? "Client"} description="Execution-safe client context for assigned delivery work." actions={<Button variant="outline" nativeButton={false} render={<Link href={backHref} />}><ArrowLeftIcon data-icon="inline-start" />Back to work</Button>}><Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-3"><Building2Icon className="text-muted-foreground" /><div><CardTitle>{view.client.companyName ?? view.client.businessName ?? "Client"}</CardTitle><CardDescription>{view.client.businessType ?? "Business profile"}</CardDescription></div></div><StatusBadge tone="active">{view.client.status ?? "Active"}</StatusBadge></div></CardHeader><CardContent><dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><InfoRow label="Contact" content={view.client.contactName ?? "—"} /><InfoRow label="Email" content={view.client.contactEmail ?? "—"} /><InfoRow label="Phone" content={view.client.contactPhone ?? "—"} /><InfoRow label="Workspace" content={mode === "marketing" ? "Marketing" : "Team"} /></dl></CardContent></Card><Card className="mt-4"><CardHeader><CardTitle>Business info</CardTitle><CardDescription>Collected onboarding context from the client portal profile.</CardDescription></CardHeader><CardContent><Tabs defaultValue="identity" className="w-full"><div className="overflow-x-auto pb-1"><TabsList className="min-w-max">{businessSections.map((tab) => <TabsTrigger key={tab.key} value={tab.key}>{tab.label}</TabsTrigger>)}</TabsList></div><div className="flex min-w-0 flex-1 flex-col gap-3">{businessSections.map((tab) => <TabsContent key={tab.key} value={tab.key}><ClientBusinessSectionContent section={tab} /></TabsContent>)}</div></Tabs></CardContent></Card></PageScaffold>;
}
