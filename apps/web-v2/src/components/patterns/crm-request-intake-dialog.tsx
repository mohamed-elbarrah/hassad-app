"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { CheckIcon, Plus, SearchIcon, UserPlus, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet, FieldLegend } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useGetCrmClientsWorkspaceQuery } from "@/lib/api/crm-clients-api";
import { useCreateCrmRequestIntakeMutation } from "@/lib/api/crm-requests-api";
import { useGetServicesQuery } from "@/lib/api/services-api";
import { showApiErrorToast, showCrmActionToast } from "@/lib/api/crm-action-toast";
import type { CrmOverviewRecord } from "@/features/crm-overview/lib/crm-overview-data";
import { BusinessType, ClientSource } from "@hassad/shared";
import type { CrmClientWorkspaceRecord } from "@/lib/api/crm-clients-api";

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "Restaurant",
  [BusinessType.CLINIC]: "Clinic",
  [BusinessType.STORE]: "Store",
  [BusinessType.SERVICE]: "Service",
  [BusinessType.OTHER]: "Other",
};

type FormValues = {
  existingClientId: string;
  newClient: {
    companyName: string;
    contactName: string;
    phoneWhatsapp: string;
    email: string;
    password: string;
    businessName: string;
    businessType: BusinessType;
    accountManager: string;
  };
  notes: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ClientPickList({
  clients,
  value,
  onSelect,
}: {
  clients: CrmClientWorkspaceRecord[];
  value: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-3">
      {clients.map((client) => {
        const selected = value === client.id;
        return (
          <button
            key={client.id}
            type="button"
            onClick={() => onSelect(client.id)}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selected ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}
          >
            <Avatar className="size-10">
              <AvatarFallback>{getInitials(client.companyName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{client.companyName}</span>
                <Badge variant="outline">{client.stage}</Badge>
              </div>
              <span className="truncate text-sm text-muted-foreground">{client.contactName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {[client.contactEmail, client.contactPhone].filter(Boolean).join(" · ")}
              </span>
            </div>
            {selected ? <CheckIcon /> : null}
          </button>
        );
      })}
    </div>
  );
}

function matchesSearch(client: CrmClientWorkspaceRecord, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    client.contactName,
    client.companyName,
    client.contactEmail,
    client.contactPhone,
    client.id,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export function CrmRequestIntakeDialog({
  open,
  onOpenChange,
  record,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: CrmOverviewRecord | null;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const { data: clientsData } = useGetCrmClientsWorkspaceQuery({ filter: "clients", sort: "highest-spend", search: clientSearch });
  const { data: services = [] } = useGetServicesQuery(undefined);
  const [createIntake] = useCreateCrmRequestIntakeMutation();

  const form = useForm<FormValues>({
    defaultValues: {
      existingClientId: "",
      newClient: {
        companyName: "",
        contactName: "",
        phoneWhatsapp: "",
        email: "",
        password: "",
        businessName: "",
        businessType: BusinessType.OTHER,
        accountManager: "",
      },
      notes: "",
    },
  });

  const clients = (clientsData?.items ?? []) as CrmClientWorkspaceRecord[];
  const selectedClientId = useWatch({ control: form.control, name: "existingClientId" });
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );
  const visibleClients = useMemo(
    () => clients.filter((client) => matchesSearch(client, clientSearch)),
    [clients, clientSearch],
  );

  useEffect(() => {
    if (!open) {
      setMode("existing");
      setServiceIds([]);
      setClientSearch("");
      form.reset();
    }
  }, [form, open]);

  async function handleSubmit() {
    if (!serviceIds.length) return;
    setSubmitting(true);
    try {
      const values = form.getValues();
      if (mode === "existing" && !values.existingClientId) {
        showCrmActionToast({
          type: "error",
          title: "Select a client",
          description: "Choose an existing client before submitting the request.",
        });
        return;
      }
      if (mode === "new") {
        const requiredFields = [
          values.newClient.companyName,
          values.newClient.contactName,
          values.newClient.phoneWhatsapp,
          values.newClient.email,
          values.newClient.password,
          values.newClient.businessName,
        ];
        if (requiredFields.some((value) => !value.trim())) {
          showCrmActionToast({
            type: "error",
            title: "Complete the client details",
            description: "Company, contact, phone, email, password, and business name are required.",
          });
          return;
        }
      }
      const result = await createIntake(
        mode === "existing"
          ? {
              mode: "existing",
              existingClient: { clientId: values.existingClientId },
              services: serviceIds.map((serviceId) => ({ serviceId, quantity: 1 })),
              notes: values.notes.trim() || undefined,
              source: ClientSource.PLATFORM,
            }
          : {
              mode: "new",
              newClient: {
                companyName: values.newClient.companyName,
                contactName: values.newClient.contactName,
                phoneWhatsapp: values.newClient.phoneWhatsapp,
                email: values.newClient.email,
                password: values.newClient.password,
                businessName: values.newClient.businessName,
                businessType: values.newClient.businessType,
                accountManager: values.newClient.accountManager || undefined,
              },
              services: serviceIds.map((serviceId) => ({ serviceId, quantity: 1 })),
              notes: values.notes.trim() || undefined,
              source: ClientSource.PLATFORM,
            },
      ).unwrap();
      showCrmActionToast(result.toast);
      onOpenChange(false);
    } catch (error) {
      showApiErrorToast(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus data-icon="inline-start" />
            New request
          </DialogTitle>
          <DialogDescription>
            Create a CRM request for an existing client or register a new client first.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="min-h-0">
            <Tabs value={mode} onValueChange={(value) => setMode(value as "existing" | "new") }>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Existing client</TabsTrigger>
                <TabsTrigger value="new">New client</TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Select client</CardTitle>
                    <CardDescription>Search by name, email, phone/WhatsApp, or company.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="crm-client-search">Search clients</FieldLabel>
                        <div className="relative">
                          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="crm-client-search"
                            value={clientSearch}
                            onChange={(event) => setClientSearch(event.target.value)}
                            placeholder="Search by name, email, phone, or company"
                            className="pl-9 pr-10"
                          />
                          {clientSearch ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="absolute right-1 top-1/2 -translate-y-1/2"
                              aria-label="Clear client search"
                              onClick={() => setClientSearch("")}
                            >
                              <XIcon />
                            </Button>
                          ) : null}
                        </div>
                      </Field>
                      <Field>
                        <FieldLabel>Client</FieldLabel>
                        <ClientPickList clients={visibleClients} value={selectedClientId} onSelect={(id) => form.setValue("existingClientId", id)} />
                        {visibleClients.length === 0 ? (
                          <Empty className="border bg-muted/20 p-6">
                            <EmptyMedia variant="icon"><UserPlus /></EmptyMedia>
                            <EmptyHeader>
                              <EmptyTitle>No matching clients</EmptyTitle>
                              <EmptyDescription>Try a different name, email, or phone number.</EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        ) : null}
                      </Field>
                    </FieldGroup>
                    {selectedClient ? (
                      <div className="rounded-xl border bg-muted/20 p-4">
                        <p className="font-medium">{selectedClient.companyName}</p>
                        <p className="text-sm text-muted-foreground">{selectedClient.contactName}</p>
                        <p className="text-xs text-muted-foreground">{[selectedClient.contactEmail, selectedClient.contactPhone].filter(Boolean).join(" · ")}</p>
                      </div>
                    ) : (
                      <Empty className="border bg-muted/20 p-6">
                        <EmptyMedia variant="icon"><UserPlus /></EmptyMedia>
                        <EmptyHeader>
                          <EmptyTitle>Select a client</EmptyTitle>
                          <EmptyDescription>Choose from the list to continue.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="new" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Create client first</CardTitle>
                    <CardDescription>Capture credentials, then continue to service selection in the same modal.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Company name</FieldLabel>
                        <Input {...form.register("newClient.companyName")} />
                      </Field>
                      <Field>
                        <FieldLabel>Contact name</FieldLabel>
                        <Input {...form.register("newClient.contactName")} />
                      </Field>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel>WhatsApp / phone</FieldLabel>
                          <Input dir="ltr" {...form.register("newClient.phoneWhatsapp")} />
                        </Field>
                        <Field>
                          <FieldLabel>Email</FieldLabel>
                          <Input dir="ltr" type="email" {...form.register("newClient.email")} />
                        </Field>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel>Password</FieldLabel>
                          <Input dir="ltr" type="password" {...form.register("newClient.password")} />
                        </Field>
                        <Field>
                          <FieldLabel>Business name</FieldLabel>
                          <Input {...form.register("newClient.businessName")} />
                        </Field>
                      </div>
                      <Field>
                        <FieldLabel>Business type</FieldLabel>
                        <Controller
                          control={form.control}
                          name="newClient.businessType"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Business type</SelectLabel>
                                  {Object.values(BusinessType).map((value) => (
                                    <SelectItem key={value} value={value}>{BUSINESS_TYPE_LABELS[value as BusinessType]}</SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </Field>
                    </FieldGroup>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <Card className="min-h-0">
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>Select all required services before submitting.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ScrollArea className="h-[360px] pr-2">
                <div className="flex flex-col gap-3">
                  {services.map((service) => {
                    const checked = serviceIds.includes(service.id);
                    return (
                      <label key={service.id} className="flex items-start gap-3 rounded-xl border p-3">
                        <Checkbox checked={checked} onCheckedChange={(next) => {
                          setServiceIds((current) =>
                            next ? [...current, service.id] : current.filter((id) => id !== service.id),
                          );
                        }} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{service.nameAr}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{service.descriptionAr ?? service.description ?? ""}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>

              <Separator />

              <FieldSet>
                <FieldLegend variant="label">Notes</FieldLegend>
                <Field>
                  <Textarea {...form.register("notes")} placeholder="Optional notes..." rows={4} />
                  <FieldDescription>Added to the request record.</FieldDescription>
                </Field>
              </FieldSet>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting || !serviceIds.length}>
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
