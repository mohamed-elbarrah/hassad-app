"use client";

import Link from "next/link";
import { useState } from "react";
import { CampaignPlatform, CampaignStatus } from "@hassad/shared";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { StateBlock } from "@/components/patterns/state-block";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetMarketingCampaignsQuery } from "@/lib/api/marketing-workspace-api";
import { formatCampaignPlatform, formatCampaignStatus, getCampaignStatusTone } from "@/features/marketing/lib/marketing-status";

export function MarketingCampaignsWorkspace() {
  const [status, setStatus] = useState<"all" | CampaignStatus>("all");
  const [platform, setPlatform] = useState<"all" | CampaignPlatform>("all");
  const [search, setSearch] = useState("");
  const query = useGetMarketingCampaignsQuery({ status: status === "all" ? undefined : status, platform: platform === "all" ? undefined : platform });
  const campaigns = (query.data?.data ?? []).filter((item) => !search || [item.name, item.client?.companyName, item.project?.name].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase()));
  return <PageScaffold title="Campaigns" description="Manage approved marketing campaigns, budgets, and performance snapshots." actions={<div className="flex flex-wrap gap-2"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campaigns" aria-label="Search campaigns" className="sm:w-64" /><Select<string> value={status} onValueChange={(value) => setStatus((value ?? "all") as typeof status)}><SelectTrigger size="sm" aria-label="Filter campaign status"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="all">All statuses</SelectItem>{Object.values(CampaignStatus).map((item) => <SelectItem key={item} value={item}>{formatCampaignStatus(item)}</SelectItem>)}</SelectGroup></SelectContent></Select><Select<string> value={platform} onValueChange={(value) => setPlatform((value ?? "all") as typeof platform)}><SelectTrigger size="sm" aria-label="Filter campaign platform"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="all">All platforms</SelectItem>{Object.values(CampaignPlatform).map((item) => <SelectItem key={item} value={item}>{formatCampaignPlatform(item)}</SelectItem>)}</SelectGroup></SelectContent></Select></div>}>
    <Card><CardHeader><CardTitle>Campaign list</CardTitle></CardHeader><CardContent>{query.isLoading && !query.data ? <WorkspaceQueryState kind="loading" loadingTitle="Loading campaigns" /> : query.isError && !query.data ? <WorkspaceQueryState kind="error" error={query.error} onRetry={() => void query.refetch()} /> : campaigns.length === 0 ? <StateBlock title="No campaigns found" description={search || status !== "all" || platform !== "all" ? "Try adjusting your filters to see more campaigns." : "Campaigns created from approved strategies will appear here."} /> : <Table><TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead>Platform</TableHead><TableHead>Project</TableHead><TableHead>Status</TableHead><TableHead>Budget</TableHead><TableHead>Spend</TableHead><TableHead>ROAS</TableHead><TableHead>Optimization</TableHead></TableRow></TableHeader><TableBody>{campaigns.map((campaign) => <TableRow key={campaign.id}><TableCell><Link href={`/marketing/campaigns/${campaign.id}`} className="font-medium hover:underline">{campaign.name}</Link><p className="text-sm text-muted-foreground">{campaign.client?.companyName ?? "No client"}</p></TableCell><TableCell>{formatCampaignPlatform(campaign.platform)}</TableCell><TableCell>{campaign.project?.name ?? "—"}</TableCell><TableCell><StatusBadge tone={getCampaignStatusTone(campaign.status)}>{formatCampaignStatus(campaign.status)}</StatusBadge></TableCell><TableCell>{campaign.budgetTotal.toLocaleString()}</TableCell><TableCell>{campaign.budgetSpent.toLocaleString()}</TableCell><TableCell>{Number(campaign.kpiSnapshots?.[0]?.roas ?? campaign.analytics?.roas ?? 0).toFixed(2)}x</TableCell><TableCell>{campaign.needsOptimization ? <StatusBadge tone="warning">Needs attention</StatusBadge> : <StatusBadge tone="success">On track</StatusBadge>}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>
  </PageScaffold>;
}
