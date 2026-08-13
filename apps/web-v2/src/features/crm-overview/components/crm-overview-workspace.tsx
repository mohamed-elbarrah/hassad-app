"use client";

import Link from "next/link";
import { LayoutGridIcon, Plus, SearchIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { GroupedKanbanBoard } from "@/components/patterns/grouped-kanban-board";
import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";
import { StatusBadge } from "@/components/patterns/status-badge";
import { CreateContractDialog } from "@/components/patterns/create-contract-dialog";
import { CreateProposalDialog } from "@/components/patterns/create-proposal-dialog";
import { CrmNoteDialog } from "@/components/patterns/crm-note-dialog";
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
  buildOverviewLanes,
  canCreateContractFromStatus,
  canOpenContractFromStatus,
  canOpenProposalFromStatus,
  filterOverviewRecords,
  formatOverviewRecord,
  matchesOverviewSearch,
  type CrmOverviewBoardFilter,
  type CrmOverviewRecord,
} from "@/features/crm-overview/lib/crm-overview-data";
import { showApiErrorToast, showCrmActionToast } from "@/lib/api/crm-action-toast";
import { useGetCrmOverviewQuery } from "@/lib/api/crm-overview-api";
import {
  useCreateCrmOrderNoteMutation,
  useUpdateCrmOrderStageMutation,
} from "@/lib/api/crm-orders-api";

export function CrmOverviewWorkspace() {
  const [boardFilter, setBoardFilter] = useState<CrmOverviewBoardFilter>("all");
  const [search, setSearch] = useState("");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [proposalDialogMode, setProposalDialogMode] = useState<"create" | "edit" | "view">("view");
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [contractDialogMode, setContractDialogMode] = useState<"create" | "edit" | "view">("create");
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useGetCrmOverviewQuery();
  const [createNote] = useCreateCrmOrderNoteMutation();
  const [updateStage] = useUpdateCrmOrderStageMutation();

  const records = useMemo(() => data ?? [], [data]);

  const filteredRecords = useMemo(() => {
    return filterOverviewRecords(records, boardFilter).filter((record) =>
      matchesOverviewSearch(record, search),
    );
  }, [boardFilter, records, search]);

  const activeBoard = useMemo(() => ({
    total: filteredRecords.length,
    lanes: buildOverviewLanes(filteredRecords),
  }), [filteredRecords]);

  const activeRecord = useMemo(
    () => records.find((record) => record.id === activeRecordId) ?? null,
    [activeRecordId, records],
  );

  const openProposalDialog = (record: CrmOverviewRecord, mode: "create" | "edit" | "view") => {
    setActiveRecordId(record.id);
    setProposalDialogMode(mode);
    setProposalDialogOpen(true);
  };

  const openContractDialog = (record: CrmOverviewRecord, mode: "create" | "edit" | "view") => {
    setActiveRecordId(record.id);
    setContractDialogMode(mode);
    setContractDialogOpen(true);
  };

  const openNoteDialog = (record: CrmOverviewRecord) => {
    setActiveRecordId(record.id);
    setNoteText("");
    setNoteDialogOpen(true);
  };

  if (isLoading && records.length === 0) {
    return <ScreenPlaceholder label="Loading CRM overview" />;
  }

  if (isError && records.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LayoutGridIcon />
          </EmptyMedia>
          <EmptyTitle>Unable to load CRM overview</EmptyTitle>
          <EmptyDescription>
            We could not fetch the live pipeline data right now.
          </EmptyDescription>
        </EmptyHeader>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </Empty>
    );
  }

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
          onMoveItem={({ itemId, toSectionId }) => {
            void updateStage({ id: itemId, toStage: toSectionId })
              .unwrap()
              .then((result) => {
                showCrmActionToast(result.toast);
                void refetch();
              })
              .catch((error) => {
                showApiErrorToast(error);
                void refetch();
              });
          }}
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
                    <Button
                      type="button"
                      size="xs"
                      onClick={() => openProposalDialog(record, record.proposalId ? "edit" : "create")}
                    >
                      <Plus data-icon="inline-start" />
                      {record.proposalId ? "Edit proposal" : "Create proposal"}
                    </Button>
                  ) : null}
                  {canCreateContractFromStatus(record.status) ? (
                    <Button
                      type="button"
                      size="xs"
                      onClick={() => openContractDialog(record, record.contractId ? "edit" : "create")}
                    >
                      <Plus data-icon="inline-start" />
                      {record.contractId ? "Edit contract" : "Create & Send Contract"}
                    </Button>
                  ) : null}
                  {canOpenContractFromStatus(record.status) ? (
                    <Button
                      type="button"
                      size="xs"
                      onClick={() => openContractDialog(record, record.contractId ? "edit" : "view")}
                    >
                      <Plus data-icon="inline-start" />
                      {record.contractId ? "Edit contract" : "Open contract"}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    nativeButton={false}
                    render={<Link href={`/crm/orders/${record.id}`} />}
                  >
                    Detail
                  </Button>
                  <Button type="button" variant="outline" size="xs" onClick={() => openNoteDialog(record)}>
                    Add note
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
        proposalId={activeRecord?.proposalId ?? null}
      />

      <CreateContractDialog
        open={contractDialogOpen}
        mode={contractDialogMode}
        onOpenChange={setContractDialogOpen}
        record={activeRecord}
        contractId={activeRecord?.contractId ?? null}
      />

      <CrmNoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        record={activeRecord}
        note={noteText}
        onNoteChange={setNoteText}
        onSave={async () => {
          if (!activeRecordId) return;
          try {
            const result = await createNote({ id: activeRecordId, content: noteText }).unwrap();
            showCrmActionToast(result.toast);
            setNoteDialogOpen(false);
            setNoteText("");
            void refetch();
          } catch (error) {
            showApiErrorToast(error);
          }
        }}
      />
    </PageScaffold>
  );
}
