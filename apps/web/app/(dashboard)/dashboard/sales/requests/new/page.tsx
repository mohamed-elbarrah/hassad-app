"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpLeft,
  Check,
  ClipboardList,
  Loader2,
  PlusCircle,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { BUSINESS_TYPE_AR, type Client } from "@hassad/shared";
import type { RequestServiceItem } from "@/features/requests/requestsApi";
import { useCreateSalesRequestForClientMutation } from "@/features/sales/salesApi";
import { useCreateSalesRequestForNewClientMutation } from "@/features/sales/salesApi";
import { useGetSalesClientsQuery } from "@/features/clients/clientsApi";
import {
  salesRequestCreationLoadErrorMessage,
  salesWorkflowErrorMessage,
} from "@/lib/i18n";
import { ErrorState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import {
  useGetServicesQuery,
  type ServiceCatalogItem,
} from "@/features/services/servicesApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type RequestMode = "existing" | "new";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getClientDisplayName(client: Client) {
  if (client.intakeCompleted === false) {
    return client.user?.name || "عميل جديد";
  }
  return client.user?.name || client.companyName;
}

function getClientBusinessLabel(client: Client) {
  return client.intakeCompleted === false
    ? "بانتظار استكمال بيانات العميل"
    : client.companyName;
}

function LoadingState() {
  return (
    <div dir="rtl" className="flex flex-col gap-6 ">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-4 w-full max-w-2xl" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Skeleton className="h-[560px] rounded-xl" />
          <Skeleton className="h-[560px] rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}

function ClientPicker({
  clients,
  value,
  query,
  open,
  onOpenChange,
  onQueryChange,
  onSelect,
}: {
  clients: Client[];
  value: Client | null;
  query: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQueryChange: (value: string) => void;
  onSelect: (client: Client) => void;
}) {
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    const list = !search
      ? clients
      : clients.filter((client) =>
          [
            client.companyName,
            client.businessName,
            client.manager?.name,
            client.accountManager,
            client.user?.name,
            client.user?.email,
            client.id,
          ]
            .filter(Boolean)
            .some((entry) => String(entry).toLowerCase().includes(search)),
        );

    return list.slice(0, 5);
  }, [clients, query]);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-auto w-full justify-start px-4 py-3 text-right font-normal"
          type="button"
          onClick={() => onOpenChange(true)}
        >
          <div className="flex w-full items-center gap-3">
            <Search className="shrink-0 text-muted-foreground" />
            {value ? (
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback>
                    {getInitials(getClientDisplayName(value))}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-semibold text-foreground">
                    {getClientDisplayName(value)}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {getClientBusinessLabel(value)}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">ابحث عن عميل موجود</span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(100vw-2rem,34rem)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={onQueryChange}
            placeholder="ابحث بالاسم أو الشركة"
            aria-label="البحث في العملاء"
          />
          <CommandList>
            <CommandEmpty>لا توجد نتائج مطابقة</CommandEmpty>
            <CommandGroup>
              {filtered.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.id}
                  onSelect={() => {
                    onSelect(client);
                    onOpenChange(false);
                  }}
                  className="min-h-11 flex items-center gap-3"
                >
                  <Avatar className="size-10">
                    <AvatarFallback>
                      {getInitials(getClientDisplayName(client))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-medium">
                      {getClientDisplayName(client)}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {getClientBusinessLabel(client)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ServiceList({
  services,
  search,
  onSearchChange,
  selectedServiceIds,
  onToggleService,
}: {
  services: ServiceCatalogItem[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedServiceIds: string[];
  onToggleService: (serviceId: string) => void;
}) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q
      ? services
      : services.filter((service) =>
          [service.nameAr, service.name, service.category, service.id]
            .filter(Boolean)
            .some((entry) => String(entry).toLowerCase().includes(q)),
        );

    return list;
  }, [search, services]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">الخدمات المطلوبة</h3>
        <Badge variant="outline">
          {formatNumber(selectedServiceIds.length)} خدمة
        </Badge>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ابحث عن خدمة"
          aria-label="البحث في الخدمات"
          className="min-h-11 pr-10"
        />
      </div>

      <div className="grid gap-3">
        {filtered.map((service) => {
          const checked = selectedServiceIds.includes(service.id);
          return (
            <Button
              key={service.id}
              type="button"
              variant="outline"
              aria-pressed={checked}
              onClick={() => onToggleService(service.id)}
              className={cn(
                "flex h-auto w-full items-center gap-3 rounded-xl border p-4 text-start transition-colors hover:border-primary/40 hover:bg-muted/20",
                checked && "border-primary bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                  checked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border",
                )}
                aria-hidden="true"
              >
                {checked ? <Check className="size-3" /> : null}
              </span>
              <span className="truncate font-medium">{service.nameAr}</span>
            </Button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Empty className="border bg-muted/20 p-8">
          <EmptyMedia variant="icon">
            <ClipboardList />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>لا توجد خدمات</EmptyTitle>
            <EmptyDescription>
              لم نعثر على خدمة مطابقة للبحث الحالي.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
    </div>
  );
}

export default function NewOrderPage() {
  const router = useRouter();
  const [mode, setMode] = useState<RequestMode>("existing");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientQuery, setClientQuery] = useState("");
  const [serviceQuery, setServiceQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedClientSnapshot, setSelectedClientSnapshot] =
    useState<Client | null>(null);
  const deferredClientQuery = useDeferredValue(clientQuery);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [existingNotes, setExistingNotes] = useState("");

  const [phoneWhatsapp, setPhoneWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const {
    data: clientsData,
    isLoading: clientsLoading,
    isError: isClientsError,
    error: clientsError,
    refetch: refetchClients,
  } = useGetSalesClientsQuery({
    limit: 100,
    search: deferredClientQuery.trim() || undefined,
  });
  const {
    data: servicesData,
    isLoading: servicesLoading,
    isError: isServicesError,
    error: servicesError,
    refetch: refetchServices,
  } = useGetServicesQuery(undefined);
  const [createRequestForClient, { isLoading: isCreatingExisting }] =
    useCreateSalesRequestForClientMutation();
  const [createNewClientRequest, { isLoading: isCreatingNew }] =
    useCreateSalesRequestForNewClientMutation();

  const clients = useMemo(() => clientsData?.items ?? [], [clientsData]);
  const services = useMemo(() => servicesData ?? [], [servicesData]);

  const selectedClient = useMemo(
    () =>
      clients.find((client) => client.id === selectedClientId) ??
      selectedClientSnapshot,
    [clients, selectedClientId, selectedClientSnapshot],
  );

  const selectedServiceItems = useMemo(
    () => services.filter((service) => selectedServices.includes(service.id)),
    [selectedServices, services],
  );

  const selectedServicesPayload: RequestServiceItem[] = selectedServices.map(
    (serviceId) => ({
      serviceId,
      quantity: 1,
    }),
  );
  const totalSelectedValue = selectedServiceItems.reduce(
    (sum, service) => sum + (service.basePrice ?? 0),
    0,
  );

  async function handleExistingSubmit() {
    if (!selectedClientId) {
      toast.error("اختر عميلًا موجودًا أولًا");
      return;
    }

    if (selectedServices.length === 0) {
      toast.error("اختر خدمة واحدة على الأقل");
      return;
    }

    try {
      const request = await createRequestForClient({
        clientId: selectedClientId,
        services: selectedServicesPayload,
        notes: existingNotes.trim() || undefined,
      }).unwrap();

      toast.success("تم إنشاء الطلب بنجاح");
      router.push(`/dashboard/sales/requests/${request.id}`);
    } catch (error) {
      toast.error(salesWorkflowErrorMessage(error));
    }
  }

  async function handleNewSubmit() {
    if (!email.trim() || !phoneWhatsapp.trim() || password.length < 8) {
      toast.error("أدخل البريد والهاتف وكلمة مرور من 8 أحرف على الأقل");
      return;
    }

    if (selectedServices.length === 0) {
      toast.error("اختر خدمة واحدة على الأقل");
      return;
    }

    try {
      const request = await createNewClientRequest({
        email: email.trim(),
        phoneWhatsapp: phoneWhatsapp.trim(),
        password,
        notes: newNotes.trim() || undefined,
        services: selectedServicesPayload,
      }).unwrap();

      toast.success(
        "تم إنشاء حساب العميل والطلب. سيكمل العميل بيانات نشاطه من البوابة.",
      );
      router.push(`/dashboard/sales/requests/${request.id}`);
    } catch (error) {
      toast.error(salesWorkflowErrorMessage(error));
    }
  }

  const isSubmitting = isCreatingExisting || isCreatingNew;

  if (clientsLoading || servicesLoading) {
    return <LoadingState />;
  }

  if (isClientsError || isServicesError) {
    return (
      <div dir="rtl" className="flex flex-col gap-6 ">
        <ErrorState
          title="تعذر تحميل بيانات الطلب الجديد"
          message={salesRequestCreationLoadErrorMessage(
            clientsError ?? servicesError,
          )}
          onRetry={() => {
            void refetchClients();
            void refetchServices();
          }}
        />
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6 ">
      <PageHeader
        title="طلب جديد"
        description="أنشئ طلبًا لعميل موجود أو سجل عميلًا جديدًا ثم أضف الخدمات المطلوبة."
        icon={PlusCircle}
        actions={
          <>
            <Button variant="outline" size="sm" className="min-h-11" asChild>
              <Link href="/dashboard/sales/pipeline">
                <ArrowUpLeft data-icon="inline-start" />
                العودة إلى المبيعات
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => {
                startTransition(() => {
                  refetchClients();
                  refetchServices();
                });
              }}
            >
              <RefreshCw data-icon="inline-start" />
              تحديث البيانات
            </Button>
          </>
        }
      />

      <Tabs
        value={mode}
        onValueChange={(value) => setMode(value as RequestMode)}
      >
        <TabsList className="grid h-auto min-h-11 w-full max-w-xl grid-cols-2">
          <TabsTrigger value="existing" className="min-h-11">
            عميل موجود
          </TabsTrigger>
          <TabsTrigger value="new" className="min-h-11">
            عميل جديد
          </TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="mt-4">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <Card>
              <CardHeader className="gap-2">
                <CardTitle>اختيار العميل</CardTitle>
                <CardDescription>
                  ابحث ثم اختر من قائمة منسدلة صغيرة. بعد الاختيار تظهر الخدمات
                  داخل نفس البطاقة.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <ClientPicker
                  clients={clients}
                  value={selectedClient}
                  query={clientQuery}
                  open={clientSearchOpen}
                  onOpenChange={setClientSearchOpen}
                  onQueryChange={setClientQuery}
                  onSelect={(client) => {
                    setSelectedClientId(client.id);
                    setSelectedClientSnapshot(client);
                    setSelectedServices([]);
                  }}
                />

                {selectedClient ? (
                  <>
                    <div className="rounded-xl border bg-muted/20 p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-11">
                          <AvatarFallback>
                            {getInitials(getClientDisplayName(selectedClient))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="font-semibold">
                            {getClientDisplayName(selectedClient)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {getClientBusinessLabel(selectedClient)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {BUSINESS_TYPE_AR[selectedClient.businessType] ||
                              selectedClient.businessType}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ServiceList
                      services={services}
                      search={serviceQuery}
                      onSearchChange={setServiceQuery}
                      selectedServiceIds={selectedServices}
                      onToggleService={(serviceId) => {
                        setSelectedServices((current) =>
                          current.includes(serviceId)
                            ? current.filter((id) => id !== serviceId)
                            : [...current, serviceId],
                        );
                      }}
                    />

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="existing-notes">ملاحظات الطلب</Label>
                      <Textarea
                        id="existing-notes"
                        value={existingNotes}
                        onChange={(event) =>
                          setExistingNotes(event.target.value)
                        }
                        placeholder="أي توضيحات إضافية لفريق المبيعات..."
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          جاهز للإرسال
                        </span>
                        <span className="text-sm text-muted-foreground">
                          سيتم ربط الطلب مباشرة بالعميل المحدد.
                        </span>
                      </div>
                      <Button
                        className="min-h-11"
                        onClick={handleExistingSubmit}
                        disabled={isSubmitting}
                      >
                        {isCreatingExisting ? (
                          <Loader2
                            data-icon="inline-start"
                            className="animate-spin"
                          />
                        ) : (
                          <ClipboardList data-icon="inline-start" />
                        )}
                        {isCreatingExisting ? "جاري الإنشاء" : "إنشاء الطلب"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Empty className="border bg-muted/20 p-8">
                    <EmptyMedia variant="icon">
                      <Users />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>اختر عميلًا من الأعلى</EmptyTitle>
                      <EmptyDescription>
                        بعد الاختيار ستظهر الخدمات والملاحظات داخل نفس البطاقة.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="gap-2">
                <CardTitle>ملخص الطلب</CardTitle>
                <CardDescription>
                  كل ما تختاره هنا سيُنشئ طلبًا واحدًا مرتبطًا بالعميل.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">العميل</p>
                  <p className="mt-2 font-medium">
                    {selectedClient
                      ? getClientDisplayName(selectedClient)
                      : "لم يتم اختيار عميل بعد"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedClient
                      ? getClientBusinessLabel(selectedClient)
                      : "ابدأ بالبحث في القائمة المنسدلة"}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">
                    الخدمات المحددة
                  </p>
                  <p className="mt-2 font-medium">
                    {formatNumber(selectedServices.length)} خدمة
                  </p>
                  <p className="text-sm text-muted-foreground">
                    القيمة التقديرية: {formatCurrency(totalSelectedValue)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="new" className="mt-4">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <Card>
              <CardHeader className="gap-2">
                <CardTitle>إنشاء حساب العميل الجديد</CardTitle>
                <CardDescription>
                  أدخل بيانات الدخول فقط. سيكمل العميل بيانات نشاطه التجاري من
                  البوابة بعد تسجيل الدخول.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@company.com"
                      className="min-h-11"
                      autoComplete="email"
                      maxLength={254}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phoneWhatsapp">رقم واتساب</Label>
                    <Input
                      id="phoneWhatsapp"
                      value={phoneWhatsapp}
                      onChange={(event) => setPhoneWhatsapp(event.target.value)}
                      placeholder="+212..."
                      className="min-h-11"
                      autoComplete="tel"
                      maxLength={30}
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor="newClientPassword">
                      كلمة المرور المؤقتة
                    </Label>
                    <Input
                      id="newClientPassword"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="8 أحرف على الأقل"
                      className="min-h-11"
                      autoComplete="new-password"
                      maxLength={128}
                    />
                    <p className="text-xs text-muted-foreground">
                      سلّم كلمة المرور للعميل بأمان، ويفضل استخدام رابط دعوة في
                      بيئة الإنتاج.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="newNotes">ملاحظات</Label>
                  <Textarea
                    id="newNotes"
                    value={newNotes}
                    onChange={(event) => setNewNotes(event.target.value)}
                    placeholder="أي توضيحات إضافية..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">جاهز للإنشاء</span>
                    <span className="text-sm text-muted-foreground">
                      سيتم إنشاء حساب العميل والطلب والخدمات، ثم يكمل العميل
                      بياناته من البوابة.
                    </span>
                  </div>
                  <Button
                    className="min-h-11"
                    onClick={handleNewSubmit}
                    disabled={isSubmitting}
                  >
                    {isCreatingNew ? (
                      <Loader2
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                    ) : (
                      <PlusCircle data-icon="inline-start" />
                    )}
                    {isCreatingNew ? "جاري الإنشاء" : "إنشاء الحساب والطلب"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="gap-2">
                <CardTitle>الخدمات المطلوبة</CardTitle>
                <CardDescription>
                  اختر الخدمات المطلوبة لهذا العميل الجديد.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceList
                  services={services}
                  search={serviceQuery}
                  onSearchChange={setServiceQuery}
                  selectedServiceIds={selectedServices}
                  onToggleService={(serviceId) => {
                    setSelectedServices((current) =>
                      current.includes(serviceId)
                        ? current.filter((id) => id !== serviceId)
                        : [...current, serviceId],
                    );
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
