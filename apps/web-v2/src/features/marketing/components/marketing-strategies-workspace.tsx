"use client";

import Link from "next/link";
import { useState } from "react";
import { MarketingStrategyStatus } from "@hassad/shared";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StateBlock } from "@/components/patterns/state-block";
import { StatusBadge } from "@/components/patterns/status-badge";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetMarketingStrategiesQuery } from "@/lib/api/marketing-workspace-api";

const labels: Record<MarketingStrategyStatus, string> = { DRAFT: "Draft", SENT: "Sent to client", APPROVED: "Approved", REVISION_REQUESTED: "Revision requested", REJECTED: "Rejected" };
function tone(status: MarketingStrategyStatus) { if (status === MarketingStrategyStatus.APPROVED) return "success" as const; if (status === MarketingStrategyStatus.SENT) return "warning" as const; if (status === MarketingStrategyStatus.REVISION_REQUESTED) return "destructive" as const; return "neutral" as const; }

export function MarketingStrategiesWorkspace() {
  const [status, setStatus] = useState<"all" | MarketingStrategyStatus>("all");
  const query = useGetMarketingStrategiesQuery({ status: status === "all" ? undefined : status });
  return <PageScaffold title="Marketing Strategies" description="Prepare, send, and track client approval for marketing strategies." actions={<Select<string> value={status} onValueChange={(value) => setStatus((value ?? "all") as typeof status)}><SelectTrigger size="sm" aria-label="Filter strategy status"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="all">All statuses</SelectItem>{Object.values(MarketingStrategyStatus).map((item) => <SelectItem key={item} value={item}>{labels[item]}</SelectItem>)}</SelectGroup></SelectContent></Select>}><Card><CardHeader><CardTitle>Strategy list</CardTitle></CardHeader><CardContent>{query.isLoading && !query.data ? <WorkspaceQueryState kind="loading" loadingTitle="Loading strategies" /> : query.isError && !query.data ? <WorkspaceQueryState kind="error" error={query.error} onRetry={() => void query.refetch()} /> : (query.data?.data ?? []).length === 0 ? <StateBlock title="No strategies" description="Strategies created from your marketing tasks will appear here." /> : <Table><TableHeader><TableRow><TableHead>Strategy</TableHead><TableHead>Task</TableHead><TableHead>Project</TableHead><TableHead>Status</TableHead><TableHead>Sent</TableHead><TableHead>Revision note</TableHead></TableRow></TableHeader><TableBody>{query.data?.data.map((item) => <TableRow key={item.id}><TableCell><Link href={`/marketing/strategies/${item.id}`} className="font-medium hover:underline">{item.fileName}</Link></TableCell><TableCell>{item.task?.title ?? item.taskId}</TableCell><TableCell>{item.task?.project?.name ?? "—"}</TableCell><TableCell><StatusBadge tone={tone(item.status)}>{labels[item.status]}</StatusBadge></TableCell><TableCell>{item.sentAt ? new Date(item.sentAt).toLocaleDateString() : "—"}</TableCell><TableCell className="max-w-xs truncate">{item.revisionNote ?? "—"}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card></PageScaffold>;
}
