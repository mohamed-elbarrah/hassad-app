"use client";

import { useMemo } from "react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CrmOverviewRecord, CrmOverviewStatus } from "@/features/crm-overview/lib/crm-overview-data";
import { isNoteRequired } from "@/features/crm-overview/lib/crm-overview-data";

const statusGroups = ["Intake", "Meeting", "Proposal", "Contract"] as const;

const statusLabels: Record<CrmOverviewStatus, string> = {
  NEW: "New",
  SCHEDULED: "Scheduled",
  DONE: "Done",
  FAILED: "Failed",
  SENT: "Proposal sent",
  NEGOTIATION: "Negotiation",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONTRACT_SENT: "Contract sent",
  SIGNED: "Signed",
  ACTIVE: "Active",
  CANCELLED: "Cancelled",
};

const statusGroupByValue: Record<CrmOverviewStatus, string> = {
  NEW: "Intake",
  SCHEDULED: "Meeting",
  DONE: "Meeting",
  FAILED: "Meeting",
  SENT: "Proposal",
  NEGOTIATION: "Proposal",
  APPROVED: "Proposal",
  REJECTED: "Proposal",
  CONTRACT_SENT: "Contract",
  SIGNED: "Contract",
  ACTIVE: "Contract",
  CANCELLED: "Contract",
};

type StatusTransitionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: CrmOverviewRecord | null;
  allowedStatuses: CrmOverviewStatus[];
  nextStatus: CrmOverviewStatus;
  onNextStatusChange: (status: CrmOverviewStatus) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  onSave: () => void;
};

export function StatusTransitionDialog({
  open,
  onOpenChange,
  record,
  allowedStatuses,
  nextStatus,
  onNextStatusChange,
  notes,
  onNotesChange,
  onSave,
}: StatusTransitionDialogProps) {
  const requiresNote = useMemo(() => isNoteRequired(nextStatus), [nextStatus]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update status</DialogTitle>
          <DialogDescription>
            Choose the next stage and add a note when the transition needs a reason or context.
          </DialogDescription>
        </DialogHeader>

        {record ? (
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{record.contactName}</p>
                <p className="truncate text-xs text-muted-foreground">{record.companyName}</p>
              </div>
              <Badge variant="secondary">{record.kind}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Current status: {record.status}</p>
          </div>
        ) : null}

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="transition-status">Next status</FieldLabel>
            <Select value={nextStatus} onValueChange={(value) => onNextStatusChange(value as CrmOverviewStatus)}>
              <SelectTrigger id="transition-status" aria-label="Choose next status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusGroups.map((group) => {
                  const items = allowedStatuses.filter((value) => statusGroupByValue[value] === group);

                  if (items.length === 0) return null;

                  return (
                    <SelectGroup key={group}>
                      <SelectLabel>{group}</SelectLabel>
                      {items.map((item) => (
                        <SelectItem key={item} value={item}>
                          {statusLabels[item]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
          </Field>

          <Field data-invalid={requiresNote && notes.trim().length === 0}>
            <FieldLabel htmlFor="transition-notes">Notes</FieldLabel>
            <Textarea
              id="transition-notes"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder="Add what happened, why the status changed, and any follow-up context."
              aria-required={requiresNote}
            />
            <FieldDescription>
              {requiresNote ? "Required for this status change." : "Optional unless the transition needs context."}
            </FieldDescription>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onSave} disabled={requiresNote && notes.trim().length === 0}>
            Save update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
