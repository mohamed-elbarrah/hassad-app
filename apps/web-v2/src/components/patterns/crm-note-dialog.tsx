"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CrmOverviewRecord } from "@/features/crm-overview/lib/crm-overview-data";

type CrmNoteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: CrmOverviewRecord | null;
  note: string;
  onNoteChange: (value: string) => void;
  onSave: () => void;
};

export function CrmNoteDialog({
  open,
  onOpenChange,
  record,
  note,
  onNoteChange,
  onSave,
}: CrmNoteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add note</DialogTitle>
          <DialogDescription>
            Capture context, follow-up details, or any internal note for this CRM card.
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
            {record.note ? (
              <p className="text-xs text-muted-foreground">Latest note: {record.note}</p>
            ) : null}
          </div>
        ) : null}

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="crm-note">Note</FieldLabel>
            <Textarea
              id="crm-note"
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Write the CRM note here..."
              className="min-h-32"
            />
            <FieldDescription>
              This note will be saved to the CRM timeline and the latest one will appear on the card.
            </FieldDescription>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onSave} disabled={note.trim().length === 0}>
            Save note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
