"use client";

import { useEffect, useMemo } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { ChevronRightIcon, Plus, Send, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { formatOverviewRecord, type CrmOverviewRecord } from "@/features/crm-overview/lib/crm-overview-data";
import { ContractType, PaymentAmountType, PaymentPlanTriggerType } from "@hassad/shared";

type ContractPlanRow = {
  label: string;
  triggerType: PaymentPlanTriggerType;
  amountType: PaymentAmountType;
  amountValue: string;
  isRecurring: boolean;
  dueOffsetDays: string;
};

type ContractFormValues = {
  requestId: string;
  proposalId: string;
  title: string;
  type: ContractType;
  startDate: string;
  endDate: string;
  monthlyValue: string;
  totalValue: string;
  downPaymentType: PaymentAmountType | "";
  downPaymentValue: string;
  numberOfMonths: string;
  pdfFileName: string;
  paymentPlan: ContractPlanRow[];
};

type CreateContractDialogProps = {
  open: boolean;
  mode: "create" | "view";
  onOpenChange: (open: boolean) => void;
  record: CrmOverviewRecord | null;
};

const createContractDefaults = (record: CrmOverviewRecord | null): ContractFormValues => ({
  requestId: record?.id ?? "",
  proposalId: record?.id ?? "",
  title: `${record?.companyName ?? "New"} contract`,
  type: ContractType.FIXED_PROJECT,
  startDate: "",
  endDate: "",
  monthlyValue: "",
  totalValue: "",
  downPaymentType: "",
  downPaymentValue: "",
  numberOfMonths: "",
  pdfFileName: "",
  paymentPlan: [],
});

export function CreateContractDialog({ open, mode, onOpenChange, record }: CreateContractDialogProps) {
  const recordMeta = record ? formatOverviewRecord(record) : null;
  const isReadOnly = mode === "view";

  const form = useForm<ContractFormValues>({
    defaultValues: createContractDefaults(record),
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "paymentPlan",
  });
  const paymentPlan = useWatch({ control: form.control, name: "paymentPlan" });
  const pdfFileName = useWatch({ control: form.control, name: "pdfFileName" });
  const advancedPlanOpen = fields.length > 0;

  useEffect(() => {
    if (!open) return;
    form.reset(createContractDefaults(record));
  }, [form, open, record]);

  const totalPaymentPlan = useMemo(
    () =>
      (paymentPlan ?? []).reduce((sum, item) => {
        const amount = Number(item.amountValue);
        return Number.isFinite(amount) ? sum + amount : sum;
      }, 0),
    [paymentPlan],
  );

  const submitDraft = form.handleSubmit(() => onOpenChange(false));
  const submitSent = form.handleSubmit(() => onOpenChange(false));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-3xl">
        <form className="flex max-h-[calc(100svh-2rem)] min-h-0 flex-col overflow-hidden p-4">
          <DialogHeader>
            <DialogTitle>{isReadOnly ? "Open contract" : "Create & Send Contract"}</DialogTitle>
            <DialogDescription>
              {isReadOnly
                ? "Review the sent contract and its payment structure."
                : `Create the contract from the approved proposal for ${record?.companyName ?? "the selected record"}.`}
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
                    <FieldLabel htmlFor="contract-title">Contract title</FieldLabel>
                    <Input id="contract-title" disabled={isReadOnly} {...form.register("title")} />
                    <FieldDescription>Internal title used for the contract and project handoff.</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="contract-type">Contract type</FieldLabel>
                    <Controller
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={isReadOnly}>
                          <SelectTrigger id="contract-type" aria-label="Choose contract type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Contract type</SelectLabel>
                              {Object.values(ContractType).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.replaceAll("_", " ")}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="contract-start-date">Start date</FieldLabel>
                    <Input id="contract-start-date" type="date" disabled={isReadOnly} {...form.register("startDate")} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contract-end-date">End date</FieldLabel>
                    <Input id="contract-end-date" type="date" disabled={isReadOnly} {...form.register("endDate")} />
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="contract-total-value">Total value</FieldLabel>
                    <Input id="contract-total-value" type="number" min="0" disabled={isReadOnly} {...form.register("totalValue")} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contract-monthly-value">Monthly value</FieldLabel>
                    <Input id="contract-monthly-value" type="number" min="0" disabled={isReadOnly} {...form.register("monthlyValue")} />
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="contract-down-payment-type">Down payment type</FieldLabel>
                    <Controller
                      control={form.control}
                      name="downPaymentType"
                      render={({ field }) => (
                        <Select value={field.value || null} onValueChange={field.onChange} disabled={isReadOnly}>
                          <SelectTrigger id="contract-down-payment-type" aria-label="Choose down payment type">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Payment amount</SelectLabel>
                              <SelectItem value={PaymentAmountType.FIXED}>Fixed</SelectItem>
                              <SelectItem value={PaymentAmountType.PERCENT}>Percent</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contract-down-payment-value">Down payment value</FieldLabel>
                    <Input id="contract-down-payment-value" type="number" min="0" disabled={isReadOnly} {...form.register("downPaymentValue")} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contract-months">Months</FieldLabel>
                    <Input id="contract-months" type="number" min="1" disabled={isReadOnly} {...form.register("numberOfMonths")} />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="contract-pdf">Attach PDF contract</FieldLabel>
                  <Input
                    id="contract-pdf"
                    type="file"
                    accept="application/pdf"
                    disabled={isReadOnly}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      form.setValue("pdfFileName", file?.name ?? "", { shouldDirty: true });
                    }}
                  />
                  <FieldDescription>
                    {pdfFileName ? `Selected file: ${pdfFileName}` : "Upload the PDF contract that will be sent to the client."}
                  </FieldDescription>
                </Field>
              </FieldGroup>

              <FieldSet>
                <FieldLegend variant="label">Payment plan</FieldLegend>
                <FieldDescription>
                  Optional advanced rows for milestone, recurring, or manual billing.
                </FieldDescription>

                <Collapsible defaultOpen={isReadOnly || advancedPlanOpen}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">Advanced rows are optional if the simple pricing fields are enough.</p>
                    {!isReadOnly ? (
                      <CollapsibleTrigger asChild>
                        <Button type="button" variant="outline">
                          <ChevronRightIcon data-icon="inline-start" />
                          Advanced plan
                        </Button>
                      </CollapsibleTrigger>
                    ) : null}
                  </div>

                  <CollapsibleContent className="mt-4">
                    <div className="flex flex-col gap-3">
                      {fields.length === 0 ? (
                        <div className="rounded-xl border border-dashed px-3 py-4 text-xs text-muted-foreground">
                          No advanced payment rows yet.
                        </div>
                      ) : null}

                      {fields.map((field, index) => (
                        <div key={field.id} className="rounded-xl border bg-background/70 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-muted-foreground">Plan row {index + 1}</p>
                            {!isReadOnly && fields.length > 0 ? (
                              <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove plan row ${index + 1}`} onClick={() => remove(index)}>
                                <Trash2Icon />
                              </Button>
                            ) : null}
                          </div>

                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <Field>
                              <FieldLabel htmlFor={`plan-label-${field.id}`}>Label</FieldLabel>
                              <Input id={`plan-label-${field.id}`} disabled={isReadOnly} {...form.register(`paymentPlan.${index}.label` as const)} />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor={`plan-due-${field.id}`}>Due offset days</FieldLabel>
                              <Input id={`plan-due-${field.id}`} type="number" min="0" disabled={isReadOnly} {...form.register(`paymentPlan.${index}.dueOffsetDays` as const)} />
                            </Field>
                          </div>

                          <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <Field>
                              <FieldLabel htmlFor={`plan-trigger-${field.id}`}>Trigger</FieldLabel>
                              <Controller
                                control={form.control}
                                name={`paymentPlan.${index}.triggerType` as const}
                                render={({ field: controllerField }) => (
                                  <Select value={controllerField.value} onValueChange={controllerField.onChange} disabled={isReadOnly}>
                                    <SelectTrigger id={`plan-trigger-${field.id}`} aria-label="Choose trigger type">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        <SelectLabel>Trigger type</SelectLabel>
                                        {Object.values(PaymentPlanTriggerType).map((triggerType) => (
                                          <SelectItem key={triggerType} value={triggerType}>
                                            {triggerType.replaceAll("_", " ")}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor={`plan-amount-type-${field.id}`}>Amount type</FieldLabel>
                              <Controller
                                control={form.control}
                                name={`paymentPlan.${index}.amountType` as const}
                                render={({ field: controllerField }) => (
                                  <Select value={controllerField.value} onValueChange={controllerField.onChange} disabled={isReadOnly}>
                                    <SelectTrigger id={`plan-amount-type-${field.id}`} aria-label="Choose amount type">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        <SelectLabel>Amount type</SelectLabel>
                                        {Object.values(PaymentAmountType).map((amountType) => (
                                          <SelectItem key={amountType} value={amountType}>
                                            {amountType}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor={`plan-amount-${field.id}`}>Amount</FieldLabel>
                              <Input id={`plan-amount-${field.id}`} type="number" min="0" disabled={isReadOnly} {...form.register(`paymentPlan.${index}.amountValue` as const)} />
                            </Field>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <Field className="flex-1">
                              <FieldLabel htmlFor={`plan-recurring-${field.id}`}>Recurring</FieldLabel>
                              <Controller
                                control={form.control}
                                name={`paymentPlan.${index}.isRecurring` as const}
                                render={({ field: controllerField }) => (
                                  <Select
                                    value={controllerField.value ? "yes" : "no"}
                                    onValueChange={(value) => controllerField.onChange(value === "yes")}
                                    disabled={isReadOnly}
                                  >
                                    <SelectTrigger id={`plan-recurring-${field.id}`} aria-label="Recurring payment">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        <SelectLabel>Recurring</SelectLabel>
                                        <SelectItem value="no">No</SelectItem>
                                        <SelectItem value="yes">Yes</SelectItem>
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </Field>
                          </div>
                        </div>
                      ))}
                    </div>

                    {!isReadOnly ? (
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            append({
                              label: "",
                              triggerType: PaymentPlanTriggerType.MANUAL,
                              amountType: PaymentAmountType.FIXED,
                              amountValue: "",
                              isRecurring: false,
                              dueOffsetDays: "0",
                            })
                          }
                        >
                          <Plus data-icon="inline-start" />
                          Add plan row
                        </Button>

                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Planned rows total</span>
                          <span className="font-semibold">SAR {totalPaymentPlan.toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Planned rows total</span>
                        <span className="font-semibold">SAR {totalPaymentPlan.toLocaleString()}</span>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </FieldSet>

              <Separator />

              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <p>Contract creation depends on an approved proposal.</p>
                <p>Request and proposal references are prefixed from the selected record.</p>
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
                  Send contract
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
