"use client";

import Link from "next/link";
import { ArrowLeftIcon, CircleDollarSignIcon, FolderKanbanIcon } from "lucide-react";

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
import type { ContractDetailRecord } from "@/features/crm-contracts/lib/contract-detail";
import { formatContractCurrency, formatContractStatus } from "@/features/crm-contracts/lib/contract-directory";

export function ContractDetailWorkspace({
  contract,
  backHref = "/admin/contracts",
}: {
  contract: ContractDetailRecord;
  backHref?: string;
}) {
  const statusItems: EntityTimelineItem[] = contract.statusHistory.map((item) => ({
    id: item.id,
    date: item.date,
    title: item.title,
    badges: (
      <StatusBadge
        tone={
          item.status === "ACTIVE"
            ? "success"
            : item.status === "ON_HOLD"
              ? "attention"
              : item.status === "CANCELLED" || item.status === "EXPIRED"
                ? "destructive"
                : item.status === "SENT"
                  ? "warning"
                  : "neutral"
        }
      >
        {formatContractStatus(item.status)}
      </StatusBadge>
    ),
    meta: <span>{item.actor}</span>,
    content: <p>{item.note}</p>,
    completed: item.completed,
  }));

  return (
    <PageScaffold
      title="Contract detail"
      description="Contract lifecycle, payment plan, billing state, and delivery linkage for one agreement."
      actions={
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={backHref} />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Contracts
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
                      {contract.clientName
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="truncate text-2xl">{contract.title}</CardTitle>
                      <CardDescription>{contract.clientName}</CardDescription>
                      <p className="text-sm text-muted-foreground">{contract.typeLabel}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={contract.statusTone}>
                        {formatContractStatus(contract.status)}
                      </StatusBadge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={contract.document.openHref} />}
                >
                  <CircleDollarSignIcon data-icon="inline-start" />
                  Open PDF
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contract facts</CardTitle>
                <CardDescription>
                  Identity and legal-commercial facts that stay stable across tabs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-4 text-sm">
                  {contract.sidebarFacts.map((fact) => (
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
                  Current contract file metadata and signature state.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">File</dt>
                    <dd className="text-right font-medium">{contract.document.fileName}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Version</dt>
                    <dd className="text-right font-medium">{contract.document.version}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Generated</dt>
                    <dd className="text-right font-medium">{contract.document.generatedAt}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Signer state</dt>
                    <dd className="text-right font-medium">{contract.document.signerState}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </>
        }
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {contract.metrics.map((metric) => (
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
            <TabsTrigger value="payment">Payment plan</TabsTrigger>
            <TabsTrigger value="history">Status history</TabsTrigger>
            <TabsTrigger value="billing">Billing & links</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.36fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Billing and delivery summary</CardTitle>
                  <CardDescription>
                    The current contract state, billing condition, and what is blocking or enabling delivery.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {contract.billingContext.map((row) => (
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
                    Connected commercial, delivery, and billing records around this contract.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {contract.linkedRecords.map((record) => (
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

          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment plan</CardTitle>
                <CardDescription>
                  Planned billing structure and the current finance state for each payment step.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contract.paymentPlan.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.label}</TableCell>
                        <TableCell>{payment.due}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatContractCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge tone={payment.tone}>{payment.status}</StatusBadge>
                        </TableCell>
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
                <CardDescription>
                  Contract lifecycle transitions from drafting through the current signed, active, or blocked state.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EntityTimeline items={statusItems} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.36fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Billing context</CardTitle>
                  <CardDescription>
                    The finance and delivery facts that explain the contract’s real operational state.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {contract.billingContext.map((row) => (
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
                  <CardTitle>Operational link</CardTitle>
                  <CardDescription>
                    Whether delivery is already live or still blocked by billing and activation work.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <FolderKanbanIcon />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {contract.linkedRecords.find((record) => record.label === "Project")?.value}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Delivery linkage status pulled from the current contract register state.
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <CircleDollarSignIcon />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {contract.linkedRecords.find((record) => record.label === "Invoices")?.value}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Finance condition currently attached to this contract.
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
