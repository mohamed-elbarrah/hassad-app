"use client";

import { useEffect, useMemo } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { Plus, Send, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatOverviewRecord, type CrmOverviewRecord } from "@/features/crm-overview/lib/crm-overview-data";
import { DurationUnit } from "@hassad/shared";

type ProposalLineItem = {
  name: string;
  description: string;
  price: string;
};

type ProposalFormValues = {
  requestId: string;
  title: string;
  serviceDescription: string;
  servicesList: ProposalLineItem[];
  totalPrice: string;
  durationDays: string;
  durationUnit: DurationUnit;
  platforms: string[];
  contactName: string;
  contactEmail: string;
  startDate: string;
  offerValidityDays: string;
  pdfFileName: string;
};

type CreateProposalDialogProps = {
  open: boolean;
  mode: "create" | "view";
  onOpenChange: (open: boolean) => void;
  record: CrmOverviewRecord | null;
};

const createProposalDefaults = (record: CrmOverviewRecord | null): ProposalFormValues => ({
  requestId: record?.id ?? "",
  title: `${record?.companyName ?? "New"} proposal`,
  serviceDescription: record?.note ?? "",
  servicesList: [
    {
      name: record?.serviceLine ?? "",
      description: record?.businessName ?? "",
      price: "",
    },
  ],
  totalPrice: "",
  durationDays: "30",
  durationUnit: DurationUnit.DAYS,
  platforms: [],
  contactName: record?.contactName ?? "",
  contactEmail: "",
  startDate: "",
  offerValidityDays: "30",
  pdfFileName: "",
});

export function CreateProposalDialog({ open, mode, onOpenChange, record }: CreateProposalDialogProps) {
  const recordMeta = record ? formatOverviewRecord(record) : null;
  const isReadOnly = mode === "view";

  const form = useForm<ProposalFormValues>({
    defaultValues: createProposalDefaults(record),
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "servicesList",
  });
  const servicesList = useWatch({ control: form.control, name: "servicesList" });
  const pdfFileName = useWatch({ control: form.control, name: "pdfFileName" });
  const platforms = useWatch({ control: form.control, name: "platforms" });

  useEffect(() => {
    if (!open) return;
    form.reset(createProposalDefaults(record));
  }, [form, open, record]);

  const totalPrice = useMemo(
    () =>
      (servicesList ?? []).reduce((sum, item) => {
        const price = Number(item.price);
        return Number.isFinite(price) ? sum + price : sum;
      }, 0),
    [servicesList],
  );

  const updatePlatforms = (value: string) => {
    form.setValue(
      "platforms",
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      { shouldDirty: true },
    );
  };

  const submitDraft = form.handleSubmit(() => onOpenChange(false));
  const submitSent = form.handleSubmit(() => onOpenChange(false));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-3xl">
        <form className="flex max-h-[calc(100svh-2rem)] min-h-0 flex-col overflow-hidden p-4">
          <DialogHeader>
            <DialogTitle>{isReadOnly ? "Open proposal" : "Create proposal"}</DialogTitle>
            <DialogDescription>
              {isReadOnly
                ? "Review the sent proposal and its commercial details."
                : `Build a PDF-backed proposal for ${record?.companyName ?? "the selected record"} using the request context.`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1 pr-1">
            <div className="flex flex-col gap-4 pr-3">
              {record ? (
                <Card size="sm" className="border-dashed bg-muted/20">
                  <CardContent className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{record.contactName}</p>
                      <p className="truncate text-xs text-muted-foreground">{record.companyName}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{recordMeta?.kindLabel}</span>
                      <span>•</span>
                      <span>{recordMeta?.businessTypeLabel}</span>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="proposal-title">Proposal title</FieldLabel>
                    <Input id="proposal-title" disabled={isReadOnly} {...form.register("title")} />
                    <FieldDescription>Internal title used in the proposal PDF and shared link.</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="proposal-start-date">Start date</FieldLabel>
                    <Input id="proposal-start-date" type="date" disabled={isReadOnly} {...form.register("startDate")} />
                    <FieldDescription>Optional start date for the commercial offer.</FieldDescription>
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="proposal-contact-name">Contact name</FieldLabel>
                    <Input id="proposal-contact-name" disabled={isReadOnly} {...form.register("contactName")} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="proposal-contact-email">Contact email</FieldLabel>
                    <Input id="proposal-contact-email" type="email" disabled={isReadOnly} {...form.register("contactEmail")} />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="proposal-description">Service description</FieldLabel>
                  <Textarea
                    id="proposal-description"
                    disabled={isReadOnly}
                    {...form.register("serviceDescription")}
                  />
                  <FieldDescription>Keep this summary short; line items below carry the detailed scope.</FieldDescription>
                </Field>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="proposal-duration-days">Duration days</FieldLabel>
                    <Input id="proposal-duration-days" type="number" min="1" disabled={isReadOnly} {...form.register("durationDays")} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="proposal-duration-unit">Duration unit</FieldLabel>
                    <Controller
                      control={form.control}
                      name="durationUnit"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={isReadOnly}>
                          <SelectTrigger id="proposal-duration-unit" aria-label="Choose duration unit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Duration unit</SelectLabel>
                              {Object.values(DurationUnit).map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit.toLowerCase()}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="proposal-validity-days">Offer validity days</FieldLabel>
                    <Input id="proposal-validity-days" type="number" min="1" disabled={isReadOnly} {...form.register("offerValidityDays")} />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="proposal-platforms">Platforms</FieldLabel>
                  <Input
                    id="proposal-platforms"
                    disabled={isReadOnly}
                    value={(platforms ?? []).join(", ")}
                    onChange={(event) => updatePlatforms(event.target.value)}
                    placeholder="Instagram, Google Ads"
                  />
                  <FieldDescription>Comma separated platforms or channels included in the proposal.</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="proposal-pdf">Attach PDF offer</FieldLabel>
                  <Input
                    id="proposal-pdf"
                    type="file"
                    accept="application/pdf"
                    disabled={isReadOnly}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      form.setValue("pdfFileName", file?.name ?? "", { shouldDirty: true });
                    }}
                  />
                  <FieldDescription>
                    {pdfFileName ? `Selected file: ${pdfFileName}` : "Upload the final PDF offer you want to send with the proposal."}
                  </FieldDescription>
                </Field>
              </FieldGroup>

              <FieldSet>
                <FieldLegend variant="label">Services and prices</FieldLegend>
                <FieldDescription>One list, one total. Keep line items focused and easy to scan.</FieldDescription>

                <div className="flex flex-col gap-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="rounded-xl border bg-background/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-muted-foreground">Line item {index + 1}</p>
                        {!isReadOnly && fields.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Remove service ${index + 1}`}
                            onClick={() => remove(index)}
                          >
                            <Trash2Icon />
                          </Button>
                        ) : null}
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.5fr)_10rem]">
                        <Field>
                          <FieldLabel htmlFor={`service-name-${field.id}`}>Service name</FieldLabel>
                          <Input id={`service-name-${field.id}`} disabled={isReadOnly} {...form.register(`servicesList.${index}.name` as const)} />
                        </Field>

                        <Field>
                          <FieldLabel htmlFor={`service-price-${field.id}`}>Price</FieldLabel>
                          <Input
                            id={`service-price-${field.id}`}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            disabled={isReadOnly}
                            {...form.register(`servicesList.${index}.price` as const)}
                          />
                        </Field>
                      </div>

                      <Field className="mt-3">
                        <FieldLabel htmlFor={`service-description-${field.id}`}>Description</FieldLabel>
                        <Textarea
                          id={`service-description-${field.id}`}
                          disabled={isReadOnly}
                          {...form.register(`servicesList.${index}.description` as const)}
                        />
                      </Field>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {!isReadOnly ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => append({ name: "", description: "", price: "" })}
                    >
                      <Plus data-icon="inline-start" />
                      Add service
                    </Button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Estimated total</span>
                    <span className="font-semibold">SAR {totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </FieldSet>

              <Separator />

              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <p>Request, contact, duration, and offer validity stay aligned with the backend create payload.</p>
                <p>Save draft keeps the proposal editable; send proposal marks it ready for the client.</p>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly ? (
              <>
                <Button type="button" variant="secondary" onClick={submitDraft}>
                  Save draft
                </Button>
                <Button type="button" onClick={submitSent}>
                  <Send data-icon="inline-start" />
                  Send proposal
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
