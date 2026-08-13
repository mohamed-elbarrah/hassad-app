"use client";

import Link from "next/link";
import {
  ArrowLeftIcon,
  Building2Icon,
  FolderKanbanIcon,
  MessageSquareIcon,
  PaperclipIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { EntityDetailLayout } from "@/components/patterns/entity-detail-layout";
import { EntityTimeline } from "@/components/patterns/entity-timeline";
import { MetricTile } from "@/components/patterns/metric-tile";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { WorkflowStepper } from "@/components/patterns/workflow-stepper";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PmDisputeThreadPanel } from "@/features/pm-disputes/components/pm-dispute-thread-panel";
import { useAcknowledgePmDisputeMutation, useResolvePmDisputeMutation } from "@/lib/api/pm-disputes-api";
import type { PmDisputeWorkspaceRecord } from "@/features/pm-disputes/lib/pm-dispute-mappers";

function buildInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function PmDisputeDetailWorkspace({ record }: { record: PmDisputeWorkspaceRecord }) {
  const { dispute } = record;
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolutionMessage, setResolutionMessage] = useState("");

  const [acknowledgePmDispute, acknowledgeState] = useAcknowledgePmDisputeMutation();
  const [resolvePmDispute, resolveState] = useResolvePmDisputeMutation();

  const stats = useMemo(() => [
    { label: "Total disputes", value: String(record.pmStats.totalDisputes), description: "All disputes assigned to this PM historically." },
    { label: "Resolved", value: String(record.pmStats.resolvedDisputes), description: "Cases successfully resolved." },
    { label: "Escalated", value: String(record.pmStats.escalatedDisputes), description: "Cases that escalated while owned by this PM." },
    { label: "PM changes", value: String(record.pmStats.pmChangedCount), description: "How often the owner was changed." },
  ], [record.pmStats]);

  async function handleAcknowledge() {
    await acknowledgePmDispute({ disputeId: dispute.id }).unwrap();
  }

  async function handleResolve() {
    if (resolutionMessage.trim().length === 0) {
      return;
    }

    await resolvePmDispute({
      disputeId: dispute.id,
      message: resolutionMessage.trim(),
    }).unwrap();

    setResolutionMessage("");
    setResolveOpen(false);
  }

  const allowAcknowledge = dispute.actions.some((action) => action.id === "acknowledge");
  const allowResolve = dispute.actions.some((action) => action.id === "resolve");

  return (
    <PageScaffold
      title="Dispute detail"
      description="PM-owned dispute workspace with client and admin conversations, evidence, history, and the resolution handoff back to verification."
      actions={
        <>
          <Button variant="outline" nativeButton={false} render={<Link href="/pm/disputes" />}>
            <ArrowLeftIcon data-icon="inline-start" />
            Disputes
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href={`/pm/projects/${dispute.projectId}`} />}>
            <FolderKanbanIcon data-icon="inline-start" />
            Open project
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href={`/pm/clients/${dispute.clientId}`} />}>
            <Building2Icon data-icon="inline-start" />
            Open client
          </Button>
          {allowAcknowledge ? (
            <Button
              type="button"
              disabled={acknowledgeState.isLoading}
              onClick={() => void handleAcknowledge()}
            >
              Acknowledge
            </Button>
          ) : null}
          {allowResolve ? (
            <Button type="button" disabled={resolveState.isLoading} onClick={() => setResolveOpen(true)}>
              Mark resolved
            </Button>
          ) : null}
        </>
      }
    >
      <EntityDetailLayout
        sidebar={
          <>
            <Card>
              <CardHeader className="gap-4">
                <div className="flex items-start gap-4">
                  <Avatar size="lg">
                    <AvatarFallback>{buildInitials(dispute.currentPmName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-2xl">{dispute.title}</CardTitle>
                      <CardDescription>
                        {dispute.ticketNumber} · {dispute.categoryLabel}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={dispute.statusTone}>{dispute.statusLabel}</StatusBadge>
                      <StatusBadge tone={dispute.priorityTone}>{dispute.priorityLabel}</StatusBadge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone={dispute.statusTone}>{dispute.signalLabel}</StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground">{dispute.signalSummary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Case details</CardTitle>
                <CardDescription>Stable facts for the PM while handling the dispute.</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Opened</dt>
                    <dd className="text-right font-medium">{dispute.openedAt}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Last activity</dt>
                    <dd className="text-right font-medium">{dispute.lastActivity}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">SLA</dt>
                    <dd className="text-right font-medium">{dispute.deadlineLabel}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Current PM</dt>
                    <dd className="text-right font-medium">{dispute.currentPmName}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Reviewed by</dt>
                    <dd className="text-right font-medium">{dispute.reviewerName ?? "Waiting review"}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Resolved by</dt>
                    <dd className="text-right font-medium">{dispute.resolverName ?? "Not resolved"}</dd>
                  </div>
                  {dispute.newPmName ? (
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted-foreground">New PM</dt>
                      <dd className="text-right font-medium">{dispute.newPmName}</dd>
                    </div>
                  ) : null}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>PM performance</CardTitle>
                <CardDescription>Historical dispute pattern for this owner.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border p-3">
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                    <div className="text-xl font-semibold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.description}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        }
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dispute.metrics.map((metric) => (
            <MetricTile key={metric.label} label={metric.label} value={metric.value} description={metric.description} trend={metric.trend} />
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Resolution path</CardTitle>
            <CardDescription>
              The dispute lifecycle from approval to client verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkflowStepper steps={dispute.workflow} />
          </CardContent>
        </Card>

        <Tabs defaultValue="overview">
          <div className="overflow-x-auto pb-1">
            <TabsList className="min-w-max">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="context">Context</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Client complaint</CardTitle>
                  <CardDescription>What the client is actually contesting.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{dispute.complaintSummary}</CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>PM handling</CardTitle>
                  <CardDescription>What the PM has done and what remains.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{dispute.pmHandlingSummary}</CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current blocker</CardTitle>
                  <CardDescription>The thing preventing clean closure right now.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{dispute.currentBlocker}</CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended next move</CardTitle>
                  <CardDescription>The clearest next step based on the current status.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{dispute.recommendedAction}</CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>PM actions</CardTitle>
                <CardDescription>
                  Resolve, follow up, and monitor the dispute according to the current state.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {dispute.actions.map((action) => (
                  <div key={action.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="font-medium">{action.label}</div>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                      <StatusBadge tone={action.tone}>{action.availability}</StatusBadge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Dispute threads</CardTitle>
                <CardDescription>
                  Client-facing and admin-facing conversation lanes kept separate from the general chat system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PmDisputeThreadPanel disputeId={dispute.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attachments">
            <Card>
              <CardHeader>
                <CardTitle>Evidence and files</CardTitle>
                <CardDescription>Supporting proof and attached response files tied to the dispute.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Linked to</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispute.attachments.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">{file.name}</TableCell>
                        <TableCell>{file.source}</TableCell>
                        <TableCell>{file.type}</TableCell>
                        <TableCell>{file.linkedTo}</TableCell>
                        <TableCell>{file.uploadedAt}</TableCell>
                        <TableCell>{file.uploadedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Status history</CardTitle>
                <CardDescription>The lifecycle trail as the dispute moved between states.</CardDescription>
              </CardHeader>
              <CardContent>
                <EntityTimeline
                  items={dispute.history.map((item) => ({
                    id: item.id,
                    date: item.date,
                    title: item.title,
                    meta: item.actor,
                    badges: <StatusBadge tone={item.tone}>{item.actor}</StatusBadge>,
                    content: item.summary,
                    completed: item.completed,
                  }))}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="context">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.38fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Project and client context</CardTitle>
                  <CardDescription>
                    The business context explaining why this dispute matters.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Building2Icon className="size-4 text-muted-foreground" />
                      Client expectation
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{dispute.clientExpectation}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FolderKanbanIcon className="size-4 text-muted-foreground" />
                      Project context
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{dispute.projectCommercialState}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquareIcon className="size-4 text-muted-foreground" />
                      Resolution summary
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{dispute.resolutionSummary}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <PaperclipIcon className="size-4 text-muted-foreground" />
                      Evidence position
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {dispute.attachments.length > 0
                        ? `${dispute.attachments.length} evidence file${dispute.attachments.length > 1 ? "s" : ""} attached to the case.`
                        : "No evidence has been attached yet."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg border p-2 text-muted-foreground">
                      <ShieldAlertIcon className="size-4" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <CardTitle>PM readout</CardTitle>
                      <CardDescription>
                        The shortest summary of risk, owner, and the next move.
                      </CardDescription>
                    </div>
                  </div>
                  <CardAction>
                    <StatusBadge tone={dispute.statusTone}>{dispute.statusLabel}</StatusBadge>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 text-sm">
                  <div className="rounded-lg border p-4">
                    <div className="font-medium">Ticket</div>
                    <p className="mt-2 text-muted-foreground">
                      {dispute.ticketNumber} · {dispute.categoryLabel} · {dispute.priorityLabel}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="font-medium">Owner</div>
                    <p className="mt-2 text-muted-foreground">{dispute.currentPmName}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="font-medium">Best next move</div>
                    <p className="mt-2 text-muted-foreground">{dispute.recommendedAction}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark dispute resolved</DialogTitle>
              <DialogDescription>
                Send the resolution note to the client. The dispute will move to client verification after submission.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <label htmlFor="pm-resolve-message" className="text-sm font-medium">
                Resolution message
              </label>
              <Textarea
                id="pm-resolve-message"
                value={resolutionMessage}
                onChange={(event) => setResolutionMessage(event.target.value)}
                rows={5}
                placeholder="Summarize what was fixed and what the client should verify."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResolveOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={resolveState.isLoading || resolutionMessage.trim().length === 0} onClick={() => void handleResolve()}>
                Send resolution
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </EntityDetailLayout>
    </PageScaffold>
  );
}
