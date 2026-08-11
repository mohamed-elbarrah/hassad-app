"use client";

import { LayoutGridIcon, Plus, SearchIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { GroupedKanbanBoard } from "@/components/patterns/grouped-kanban-board";
import { StatusBadge } from "@/components/patterns/status-badge";
import { CreateContractDialog } from "@/components/patterns/create-contract-dialog";
import { CreateProposalDialog } from "@/components/patterns/create-proposal-dialog";
import { StatusTransitionDialog } from "@/components/patterns/status-transition-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CRM_OVERVIEW_FIXTURE,
  buildOverviewLanes,
  canCreateContractFromStatus,
  canOpenContractFromStatus,
  canOpenProposalFromStatus,
  filterOverviewRecords,
  formatOverviewRecord,
  getAllowedStatusesForRecord,
  matchesOverviewSearch,
  type CrmOverviewBoardFilter,
  type CrmOverviewRecord,
  type CrmOverviewStatus,
} from "@/features/crm-overview/lib/crm-overview-data";

export function CrmOverviewWorkspace() {
  const [boardFilter, setBoardFilter] = useState<CrmOverviewBoardFilter>("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [proposalDialogMode, setProposalDialogMode] = useState<"create" | "view">("view");
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [contractDialogMode, setContractDialogMode] = useState<"create" | "view">("create");
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<CrmOverviewStatus>("NEW");
  const [transitionNotes, setTransitionNotes] = useState("");

  const filteredRecords = useMemo(() => {
    return filterOverviewRecords(CRM_OVERVIEW_FIXTURE, boardFilter).filter((record) =>
      matchesOverviewSearch(record, search),
    );
  }, [boardFilter, search]);

  const activeBoard = useMemo(() => ({
    total: filteredRecords.length,
    lanes: buildOverviewLanes(filteredRecords),
  }), [filteredRecords]);

  const activeRecord = useMemo(
    () => CRM_OVERVIEW_FIXTURE.find((record) => record.id === activeRecordId) ?? null,
    [activeRecordId],
  );

  const openStatusDialog = (record: CrmOverviewRecord) => {
    setActiveRecordId(record.id);
    setNextStatus(record.status);
    setTransitionNotes("");
    setDialogOpen(true);
  };

  const openProposalDialog = (record: CrmOverviewRecord, mode: "create" | "view") => {
    setActiveRecordId(record.id);
    setProposalDialogMode(mode);
    setProposalDialogOpen(true);
  };

  const openContractDialog = (record: CrmOverviewRecord, mode: "create" | "view") => {
    setActiveRecordId(record.id);
    setContractDialogMode(mode);
    setContractDialogOpen(true);
  };

  return (
    <PageScaffold
      title="CRM Overview"
      description="Grouped kanban for the commercial pipeline. Switch between all records, leads, or orders and search by account details."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search accounts, contacts, notes..."
              className="h-8 w-72 pl-7 pr-8"
            />
            {search ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <XIcon />
              </Button>
            ) : null}
          </div>

          <ToggleGroup
            value={[boardFilter]}
            onValueChange={(value) => {
              const nextValue = value[0];
              if (nextValue === "all" || nextValue === "leads" || nextValue === "orders") {
                setBoardFilter(nextValue);
              }
            }}
            variant="outline"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="leads">Leads</ToggleGroupItem>
            <ToggleGroupItem value="orders">Orders</ToggleGroupItem>
          </ToggleGroup>
        </div>
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="gap-1">
            <LayoutGridIcon />
            Shared pipeline
          </Badge>
          <span>{activeBoard.total} cards visible</span>
        </div>

        <StatusBadge tone="active">Unified flow</StatusBadge>
      </div>

      {activeBoard.total === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutGridIcon />
            </EmptyMedia>
            <EmptyTitle>No cards match this search</EmptyTitle>
            <EmptyDescription>
              Try a different company, contact, service line, or clear the search to see the full pipeline.
            </EmptyDescription>
          </EmptyHeader>
          <Button type="button" variant="outline" onClick={() => setSearch("")}>Clear search</Button>
        </Empty>
      ) : (
        <GroupedKanbanBoard
          key={`${boardFilter}:${search}`}
          lanes={activeBoard.lanes}
          renderCard={(record) => {
            const meta = formatOverviewRecord(record);

            return (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{record.contactName}</p>
                    <p className="truncate text-xs text-muted-foreground">{record.companyName}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {meta.kindLabel}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">{meta.businessTypeLabel}</p>

                <p className="line-clamp-2 text-xs text-muted-foreground">{record.note}</p>

                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate" dir="ltr">
                    {record.phoneWhatsapp}
                  </span>
                  <span>{meta.lastActivityLabel}</span>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-2">
                  {canOpenProposalFromStatus(record.status) ? (
                    <Button type="button" size="xs" onClick={() => openProposalDialog(record, "view")}>
                      <Plus data-icon="inline-start" />
                      Open proposal
                    </Button>
                  ) : null}
                  {canCreateContractFromStatus(record.status) ? (
                    <Button type="button" size="xs" onClick={() => openContractDialog(record, "create")}>
                      <Plus data-icon="inline-start" />
                      Create & Send Contract
                    </Button>
                  ) : null}
                  {canOpenContractFromStatus(record.status) ? (
                    <Button type="button" size="xs" onClick={() => openContractDialog(record, "view")}>
                      <Plus data-icon="inline-start" />
                      Open contract
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" size="xs" onClick={() => openStatusDialog(record)}>
                    Update status
                  </Button>
                </div>

                {record.requiresNote ? (
                  <p className="text-xs text-muted-foreground">Reason required for this transition.</p>
                ) : null}
              </div>
            );
          }}
        />
      )}

      <CreateProposalDialog
        open={proposalDialogOpen}
        mode={proposalDialogMode}
        onOpenChange={setProposalDialogOpen}
        record={activeRecord}
      />

      <CreateContractDialog
        open={contractDialogOpen}
        mode={contractDialogMode}
        onOpenChange={setContractDialogOpen}
        record={activeRecord}
      />

      <StatusTransitionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={activeRecord}
        allowedStatuses={activeRecord ? getAllowedStatusesForRecord(activeRecord.status) : [nextStatus]}
        nextStatus={nextStatus}
        onNextStatusChange={setNextStatus}
        notes={transitionNotes}
        onNotesChange={setTransitionNotes}
        onSave={() => {
          setDialogOpen(false);
        }}
      />
    </PageScaffold>
  );
}
