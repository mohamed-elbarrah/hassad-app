"use client";

import Link from "next/link";
import { ArrowLeftIcon, FileSignatureIcon, FileTextIcon, UserRoundIcon } from "lucide-react";

import {
  EntityTimeline,
  type EntityTimelineItem,
} from "@/components/patterns/entity-timeline";
import { EntityDetailLayout } from "@/components/patterns/entity-detail-layout";
import { MetricTile } from "@/components/patterns/metric-tile";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProposalDetailRecord } from "@/features/crm-proposals/lib/proposal-detail";
import { formatProposalCurrency, formatProposalStatus } from "@/features/crm-proposals/lib/proposal-directory";

export function ProposalDetailWorkspace({
  proposal,
  backHref = "/admin/proposals",
}: {
  proposal: ProposalDetailRecord;
  backHref?: string;
}) {
  const document = proposal.document ?? {
    fileName: `${proposal.title.toLowerCase().replaceAll(" ", "-")}.pdf`,
    version: "v1",
    generatedAt: proposal.sentLabel,
    openHref: "#",
  };
  const revisionItems: EntityTimelineItem[] = proposal.revisionHistory.map((item) => ({
    id: item.id,
    date: item.date,
    title: item.title,
    badges: (
      <StatusBadge
        tone={
          item.status === "APPROVED"
            ? "success"
            : item.status === "REVISION_REQUESTED"
              ? "attention"
              : item.status === "REJECTED"
                ? "destructive"
                : item.status === "SENT"
                  ? "warning"
                  : "neutral"
        }
      >
        {formatProposalStatus(item.status)}
      </StatusBadge>
    ),
    meta: <span>{item.actor}</span>,
    content: <p>{item.note}</p>,
    completed: item.completed,
  }));

  return (
    <PageScaffold
      title="Proposal detail"
      description="Commercial scope, pricing, revision flow, and contract readiness for one proposal."
      actions={
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={backHref} />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Proposals
        </Button>
      }
    >
      <EntityDetailLayout
        sidebar={
          <>
            <Card>
              <CardHeader className="gap-4">
                <div className="flex items-start gap-4">
                  <Avatar size="lg">
                    <AvatarFallback>
                      {proposal.clientName
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="truncate text-2xl">{proposal.title}</CardTitle>
                      <CardDescription>{proposal.clientName}</CardDescription>
                      <p className="text-sm text-muted-foreground">{proposal.requestName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={proposal.statusTone}>
                        {formatProposalStatus(proposal.status)}
                      </StatusBadge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={document.openHref} />}
                >
                  <FileTextIcon data-icon="inline-start" />
                  Open PDF
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proposal facts</CardTitle>
                <CardDescription>
                  Identity and commercial facts that stay stable across every tab.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-4 text-sm">
                  {proposal.sidebarFacts.map((fact) => (
                    <div key={fact.label} className="flex items-start justify-between gap-4">
                      <dt className="text-muted-foreground">{fact.label}</dt>
                      <dd className="text-right font-medium">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document</CardTitle>
                <CardDescription>
                  Current proposal file metadata and document version state.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">File</dt>
                    <dd className="text-right font-medium">{document.fileName}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Version</dt>
                    <dd className="text-right font-medium">{document.version}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Generated</dt>
                    <dd className="text-right font-medium">{document.generatedAt}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Validity</dt>
                    <dd className="text-right font-medium">{proposal.validUntilLabel}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </>
        }
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {proposal.metrics.map((metric) => (
            <MetricTile
              key={metric.label}
              label={metric.label}
              value={metric.value}
              description={metric.description}
              trend={metric.trend}
            />
          ))}
        </section>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scope">Scope & pricing</TabsTrigger>
            <TabsTrigger value="revisions">Revision history</TabsTrigger>
            <TabsTrigger value="context">Commercial context</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.36fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Commercial summary</CardTitle>
                  <CardDescription>
                    Current proposal state, decision signal, and what still blocks the next step.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {proposal.commercialContext.map((row) => (
                    <div key={row.label} className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">{row.label}</span>
                      <span className="font-medium">{row.value}</span>
                      <span className="text-xs text-muted-foreground">{row.helper}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Linked records</CardTitle>
                  <CardDescription>
                    Related commercial records around this proposal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {proposal.linkedRecords.map((record) => (
                    <div key={record.label} className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{record.label}</span>
                        <span className="font-medium">{record.value}</span>
                      </div>
                      {record.tone ? (
                        <StatusBadge tone={record.tone}>{record.value}</StatusBadge>
                      ) : record.href ? (
                        <Button
                          variant="outline"
                          size="sm"
                          nativeButton={false}
                          render={<Link href={record.href} />}
                        >
                          Open
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scope">
            <Card>
              <CardHeader>
                <CardTitle>Scope and pricing</CardTitle>
                <CardDescription>
                  Service-level scope, quantity, and pricing in the current proposal version.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposal.services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.service}</TableCell>
                        <TableCell className="text-muted-foreground">{service.scope}</TableCell>
                        <TableCell>{service.quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatProposalCurrency(service.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revisions">
            <Card>
              <CardHeader>
                <CardTitle>Revision history</CardTitle>
                <CardDescription>
                  The actual commercial path from draft to the current client decision state.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EntityTimeline items={revisionItems} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="context">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.36fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Commercial context</CardTitle>
                  <CardDescription>
                    The facts that explain why this proposal is in its current commercial state.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {proposal.commercialContext.map((row) => (
                    <div key={row.label} className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">{row.label}</span>
                      <span className="font-medium">{row.value}</span>
                      <span className="text-xs text-muted-foreground">{row.helper}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prepared by</CardTitle>
                  <CardDescription>
                    Proposal owner and commercial accountability.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <UserRoundIcon />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{proposal.owner}</span>
                      <span className="text-sm text-muted-foreground">
                        Commercial owner for scoping, revisions, and approval follow-up.
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <FileSignatureIcon />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{proposal.responseLabel}</span>
                      <span className="text-sm text-muted-foreground">
                        Latest client-side signal against this proposal.
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </EntityDetailLayout>
    </PageScaffold>
  );
}
