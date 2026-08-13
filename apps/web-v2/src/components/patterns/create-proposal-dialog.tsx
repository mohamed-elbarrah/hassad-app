"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { Plus, Send, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet, FieldLegend } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useGetCrmProposalDetailQuery, useCreateCrmProposalMutation, useSendCrmProposalMutation, useUpdateCrmProposalMutation } from "@/lib/api/crm-proposals-api";
import { showApiErrorToast, showCrmActionToast } from "@/lib/api/crm-action-toast";
import { formatOverviewRecord, type CrmOverviewRecord } from "@/features/crm-overview/lib/crm-overview-data";
import { DurationUnit } from "@hassad/shared";

type ProposalLineItem = {
  name: string;
  description: string;
  price: string;
};

type ProposalFormValues = {
  requestId: string;
  leadId: string;
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
  mode: "create" | "edit" | "view";
  onOpenChange: (open: boolean) => void;
  record: CrmOverviewRecord | null;
  proposalId?: string | null;
};

function getProposalContext(record: CrmOverviewRecord | null) {
  if (!record) return { requestId: "", leadId: "" };
  if (record.kind === "order") return { requestId: record.id, leadId: "" };
  return { requestId: "", leadId: record.id };
}

function getFileName(filePath?: string | null) {
  if (!filePath) return "";
  return filePath.split("/").pop() ?? filePath;
}

function parseProposalServices(value: unknown): ProposalLineItem[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }

  return value.map((item) => ({
    name: typeof item === "object" && item && "name" in item ? String((item as { name?: unknown }).name ?? "") : "",
    description:
      typeof item === "object" && item && "description" in item
        ? String((item as { description?: unknown }).description ?? "")
        : "",
    price:
      typeof item === "object" && item && "price" in item && (item as { price?: unknown }).price != null
        ? String((item as { price?: unknown }).price ?? "")
        : "",
  }));
}

function createProposalDefaults(record: CrmOverviewRecord | null, proposal?: { [key: string]: unknown } | null): ProposalFormValues {
  const context = getProposalContext(record);
  const services = parseProposalServices(proposal?.servicesList);
  const firstLine = services[0] ?? {
    name: record?.serviceLine ?? "",
    description: record?.businessName ?? "",
    price: "",
  };

  return {
    requestId: String(proposal?.requestId ?? context.requestId ?? ""),
    leadId: String(proposal?.leadId ?? context.leadId ?? ""),
    title: String(proposal?.title ?? `${record?.companyName ?? "New"} proposal`),
    serviceDescription: String(proposal?.serviceDescription ?? record?.note ?? ""),
    servicesList: services.length > 0 ? services : [firstLine],
    totalPrice: String(proposal?.totalPrice ?? ""),
    durationDays: String(proposal?.durationDays ?? 30),
    durationUnit: (proposal?.durationUnit as DurationUnit | undefined) ?? DurationUnit.DAYS,
    platforms: Array.isArray(proposal?.platforms) ? (proposal.platforms as string[]) : [],
    contactName: String(proposal?.contactName ?? record?.contactName ?? ""),
    contactEmail: String(proposal?.contactEmail ?? ""),
    startDate: proposal?.startDate ? String(proposal.startDate).slice(0, 10) : "",
    offerValidityDays: String(proposal?.offerValidityDays ?? 30),
    pdfFileName: getFileName(proposal?.filePath as string | null | undefined),
  };
}

function buildProposalFormData(values: ProposalFormValues, file: File | null) {
  const formData = new FormData();
  formData.append("title", values.title);
  if (values.requestId) formData.append("requestId", values.requestId);
  if (values.leadId) formData.append("leadId", values.leadId);
  if (values.serviceDescription) formData.append("serviceDescription", values.serviceDescription);
  formData.append("servicesList", JSON.stringify(values.servicesList));
  if (values.totalPrice) formData.append("totalPrice", values.totalPrice);
  if (values.durationDays) formData.append("durationDays", values.durationDays);
  formData.append("durationUnit", values.durationUnit);
  formData.append("platforms", JSON.stringify(values.platforms));
  if (values.contactName) formData.append("contactName", values.contactName);
  if (values.contactEmail) formData.append("contactEmail", values.contactEmail);
  if (values.startDate) formData.append("startDate", values.startDate);
  if (values.offerValidityDays) formData.append("offerValidityDays", values.offerValidityDays);
  if (file) formData.append("file", file);
  return formData;
}

export function CreateProposalDialog({ open, mode, onOpenChange, record, proposalId }: CreateProposalDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const isReadOnly = mode === "view";
  const isEditMode = mode === "edit" || mode === "view";

  const proposalQuery = useGetCrmProposalDetailQuery(proposalId ?? "", {
    skip: !open || !proposalId,
  });

  const [createProposal] = useCreateCrmProposalMutation();
  const [updateProposal] = useUpdateCrmProposalMutation();
  const [sendProposal] = useSendCrmProposalMutation();

  const form = useForm<ProposalFormValues>({
    defaultValues: createProposalDefaults(record, proposalQuery.data as Record<string, unknown> | undefined),
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "servicesList",
  });
  const servicesList = useWatch({ control: form.control, name: "servicesList" });
  const pdfFileName = useWatch({ control: form.control, name: "pdfFileName" });
  const platforms = useWatch({ control: form.control, name: "platforms" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    form.reset(createProposalDefaults(record, proposalQuery.data as Record<string, unknown> | undefined));
  }, [form, open, proposalQuery.data, record]);

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

  const closeDialog = () => {
    setFile(null);
    onOpenChange(false);
  };

  const saveDraft = form.handleSubmit(async () => {
    setSubmitting(true);
    try {
      const values = form.getValues();
      const body = buildProposalFormData(values, file);
      const result = proposalId
        ? await updateProposal({ id: proposalId, body }).unwrap()
        : await createProposal(body).unwrap();
      showCrmActionToast(result.toast);
      closeDialog();
    } catch (error) {
      showApiErrorToast(error);
    } finally {
      setSubmitting(false);
    }
  });

  const sendNow = form.handleSubmit(async () => {
    setSubmitting(true);
    try {
      const values = form.getValues();
      const body = buildProposalFormData(values, file);
      const saved = proposalId
        ? await updateProposal({ id: proposalId, body }).unwrap()
        : await createProposal(body).unwrap();
      const sent = await sendProposal({ id: saved.proposal.id }).unwrap();
      showCrmActionToast(sent.toast);
      closeDialog();
    } catch (error) {
      showApiErrorToast(error);
    } finally {
      setSubmitting(false);
    }
  });

  const selectedFileLabel = file?.name || pdfFileName;
  const title = isReadOnly ? "Open proposal" : isEditMode ? "Edit proposal" : "Create proposal";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-3xl">
        <form className="flex max-h-[calc(100svh-2rem)] min-h-0 flex-col overflow-hidden p-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {isReadOnly
                ? "Review the proposal draft and current commercial details."
                : "Compose the proposal, keep it as a draft, or send it directly from the CRM."}
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
                      <span>{formatOverviewRecord(record).kindLabel}</span>
                      <span>•</span>
                      <span>{formatOverviewRecord(record).businessTypeLabel}</span>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="proposal-title">Proposal title</FieldLabel>
                    <Input id="proposal-title" disabled={isReadOnly || submitting} {...form.register("title")} />
                    <FieldDescription>Internal title used in the proposal PDF and shared link.</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="proposal-start-date">Start date</FieldLabel>
                    <Input id="proposal-start-date" type="date" disabled={isReadOnly || submitting} {...form.register("startDate")} />
                    <FieldDescription>Optional start date for the commercial offer.</FieldDescription>
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="proposal-contact-name">Contact name</FieldLabel>
                    <Input id="proposal-contact-name" disabled={isReadOnly || submitting} {...form.register("contactName")} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="proposal-contact-email">Contact email</FieldLabel>
                    <Input id="proposal-contact-email" type="email" disabled={isReadOnly || submitting} {...form.register("contactEmail")} />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="proposal-description">Service description</FieldLabel>
                  <Textarea id="proposal-description" disabled={isReadOnly || submitting} {...form.register("serviceDescription")} />
                  <FieldDescription>Keep this summary short; line items below carry the detailed scope.</FieldDescription>
                </Field>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="proposal-duration-days">Duration days</FieldLabel>
                    <Input id="proposal-duration-days" type="number" min="1" disabled={isReadOnly || submitting} {...form.register("durationDays")} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="proposal-duration-unit">Duration unit</FieldLabel>
                    <Controller
                      control={form.control}
                      name="durationUnit"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={isReadOnly || submitting}>
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
                    <Input id="proposal-validity-days" type="number" min="1" disabled={isReadOnly || submitting} {...form.register("offerValidityDays")} />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="proposal-platforms">Platforms</FieldLabel>
                  <Input
                    id="proposal-platforms"
                    disabled={isReadOnly || submitting}
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
                    disabled={isReadOnly || submitting}
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                  <FieldDescription>
                    {selectedFileLabel ? `Selected file: ${selectedFileLabel}` : "Upload the final PDF offer you want to send with the proposal."}
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
                        {!isReadOnly && !submitting && fields.length > 1 ? (
                          <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove service ${index + 1}`} onClick={() => remove(index)}>
                            <Trash2Icon />
                          </Button>
                        ) : null}
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.5fr)_10rem]">
                        <Field>
                          <FieldLabel htmlFor={`service-name-${field.id}`}>Service name</FieldLabel>
                          <Input id={`service-name-${field.id}`} disabled={isReadOnly || submitting} {...form.register(`servicesList.${index}.name` as const)} />
                        </Field>

                        <Field>
                          <FieldLabel htmlFor={`service-price-${field.id}`}>Price</FieldLabel>
                          <Input id={`service-price-${field.id}`} type="number" inputMode="decimal" min="0" disabled={isReadOnly || submitting} {...form.register(`servicesList.${index}.price` as const)} />
                        </Field>
                      </div>

                      <Field className="mt-3">
                        <FieldLabel htmlFor={`service-description-${field.id}`}>Description</FieldLabel>
                        <Textarea id={`service-description-${field.id}`} disabled={isReadOnly || submitting} {...form.register(`servicesList.${index}.description` as const)} />
                      </Field>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {!isReadOnly ? (
                    <Button type="button" variant="outline" onClick={() => append({ name: "", description: "", price: "" })} disabled={submitting}>
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
                <p>Drafts stay editable until you send the proposal.</p>
                <p>The API controls the toast copy after save or send.</p>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={submitting}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly ? (
              <>
                <Button type="button" variant="secondary" onClick={saveDraft} disabled={submitting}>
                  Save draft
                </Button>
                <Button type="button" onClick={sendNow} disabled={submitting}>
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
