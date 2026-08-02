"use client";

import { startTransition, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpLeft,
  ClipboardList,
  Loader2,
  PlusCircle,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import {
  BUSINESS_TYPE_AR,
  CLIENT_SOURCE_AR,
  ClientSource,
  type BusinessType,
  type Client,
} from "@hassad/shared";
import {
  useCreateRequestForClientMutation,
  useCreateRequestMutation,
  type RequestServiceItem,
} from "@/features/requests/requestsApi";
import { useGetClientsQuery } from "@/features/clients/clientsApi";
import { useGetServicesQuery, type ServiceCatalogItem } from "@/features/services/servicesApi";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type RequestMode = "existing" | "new";

const BUSINESS_OPTIONS: Array<{ value: BusinessType; label: string }> = [
  { value: "RESTAURANT" as BusinessType, label: BUSINESS_TYPE_AR.RESTAURANT },
  { value: "CLINIC" as BusinessType, label: BUSINESS_TYPE_AR.CLINIC },
  { value: "STORE" as BusinessType, label: BUSINESS_TYPE_AR.STORE },
  { value: "SERVICE" as BusinessType, label: BUSINESS_TYPE_AR.SERVICE },
  { value: "OTHER" as BusinessType, label: BUSINESS_TYPE_AR.OTHER },
];

const SOURCE_OPTIONS: Array<{ value: ClientSource; label: string }> = [
  { value: ClientSource.PLATFORM, label: CLIENT_SOURCE_AR[ClientSource.PLATFORM] },
  { value: ClientSource.WEBSITE, label: CLIENT_SOURCE_AR[ClientSource.WEBSITE] },
  { value: ClientSource.WHATSAPP, label: CLIENT_SOURCE_AR[ClientSource.WHATSAPP] },
  { value: ClientSource.REFERRAL, label: CLIENT_SOURCE_AR[ClientSource.REFERRAL] },
  { value: ClientSource.AD, label: CLIENT_SOURCE_AR[ClientSource.AD] },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function LoadingState() {
  return (
    <div dir="rtl" className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
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
                  <AvatarFallback>{getInitials(value.companyName)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-semibold text-foreground">
                    {value.user?.name || value.companyName}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">{value.companyName}</span>
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
                  className="flex items-center gap-3"
                >
                  <Avatar className="size-10">
                    <AvatarFallback>{getInitials(client.companyName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-medium">
                      {client.user?.name || client.companyName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {client.companyName}
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
        <Badge variant="outline">{formatNumber(selectedServiceIds.length)} خدمة</Badge>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ابحث عن خدمة"
          className="pr-10"
        />
      </div>

      <div className="grid gap-3">
        {filtered.map((service) => {
          const checked = selectedServiceIds.includes(service.id);
          return (
            <div
              key={service.id}
              role="button"
              tabIndex={0}
              onClick={() => onToggleService(service.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onToggleService(service.id);
                }
              }}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-xl border p-4 text-start transition-colors hover:border-primary/40 hover:bg-muted/20",
                checked && "border-primary bg-primary/5",
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => onToggleService(service.id)}
                onClick={(event) => event.stopPropagation()}
              />
              <span className="truncate font-medium">{service.nameAr}</span>
            </div>
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
            <EmptyDescription>لم نعثر على خدمة مطابقة للبحث الحالي.</EmptyDescription>
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
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [existingNotes, setExistingNotes] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phoneWhatsapp, setPhoneWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType | "">("");
  const [source, setSource] = useState<ClientSource>(ClientSource.PLATFORM);
  const [newNotes, setNewNotes] = useState("");

  const { data: clientsData, isLoading: clientsLoading, refetch: refetchClients } = useGetClientsQuery({ limit: 1000 });
  const { data: servicesData, isLoading: servicesLoading, refetch: refetchServices } = useGetServicesQuery(undefined);
  const [createRequestForClient, { isLoading: isCreatingExisting }] = useCreateRequestForClientMutation();
  const [createRequest, { isLoading: isCreatingNew }] = useCreateRequestMutation();

  const clients = useMemo(() => clientsData?.items ?? [], [clientsData]);
  const services = useMemo(() => servicesData ?? [], [servicesData]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  const selectedServiceItems = useMemo(
    () => services.filter((service) => selectedServices.includes(service.id)),
    [selectedServices, services],
  );

  const selectedServicesPayload: RequestServiceItem[] = selectedServices.map((serviceId) => ({
    serviceId,
    quantity: 1,
  }));
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
      const message = (error as { data?: { message?: string } })?.data?.message ?? "فشل إنشاء الطلب";
      toast.error(message);
    }
  }

  async function handleNewSubmit() {
    if (!companyName.trim() || !contactName.trim() || !phoneWhatsapp.trim() || !businessType) {
      toast.error("أكمل بيانات العميل الجديد الأساسية أولًا");
      return;
    }

    if (selectedServices.length === 0) {
      toast.error("اختر خدمة واحدة على الأقل");
      return;
    }

    try {
      const request = await createRequest({
        contactName: contactName.trim(),
        companyName: companyName.trim(),
        businessName: businessName.trim() || companyName.trim(),
        phoneWhatsapp: phoneWhatsapp.trim(),
        email: email.trim() || undefined,
        businessType,
        source,
        notes: newNotes.trim() || undefined,
        services: selectedServicesPayload,
      }).unwrap();

      toast.success("تم إنشاء الطلب الجديد بنجاح");
      router.push(`/dashboard/sales/requests/${request.id}`);
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message ?? "فشل إنشاء الطلب";
      toast.error(message);
    }
  }

  const isSubmitting = isCreatingExisting || isCreatingNew;

  if (clientsLoading || servicesLoading) {
    return <LoadingState />;
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card className="overflow-hidden">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/sales/pipeline">
                  <ArrowUpLeft data-icon="inline-start" />
                  العودة إلى المبيعات
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
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
            </div>

            <div className="flex items-start gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <PlusCircle />
              </div>
              <div className="flex flex-col gap-2">
                <CardTitle className="text-2xl sm:text-3xl">طلب جديد</CardTitle>
                <CardDescription className="max-w-3xl text-sm sm:text-base">
                  أنشئ طلبًا لعميل موجود أو سجل عميلًا جديدًا ثم أضف الخدمات المطلوبة.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={mode} onValueChange={(value) => setMode(value as RequestMode)}>
        <TabsList className="grid w-full max-w-xl grid-cols-2">
          <TabsTrigger value="existing">عميل موجود</TabsTrigger>
          <TabsTrigger value="new">عميل جديد</TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="mt-4">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <Card>
              <CardHeader className="gap-2">
                <CardTitle>اختيار العميل</CardTitle>
                <CardDescription>
                  ابحث ثم اختر من قائمة منسدلة صغيرة. بعد الاختيار تظهر الخدمات داخل نفس البطاقة.
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
                    setSelectedServices([]);
                  }}
                />

                {selectedClient ? (
                  <>
                    <div className="rounded-xl border bg-muted/20 p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-11">
                          <AvatarFallback>{getInitials(selectedClient.companyName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="font-semibold">
                            {selectedClient.user?.name || selectedClient.companyName}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {selectedClient.companyName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {BUSINESS_TYPE_AR[selectedClient.businessType] || selectedClient.businessType}
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
                        onChange={(event) => setExistingNotes(event.target.value)}
                        placeholder="أي توضيحات إضافية لفريق المبيعات..."
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">جاهز للإرسال</span>
                        <span className="text-sm text-muted-foreground">
                          سيتم ربط الطلب مباشرة بالعميل المحدد.
                        </span>
                      </div>
                      <Button onClick={handleExistingSubmit} disabled={isSubmitting}>
                        {isCreatingExisting ? (
                          <Loader2 data-icon="inline-start" className="animate-spin" />
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
                    {selectedClient ? selectedClient.user?.name || selectedClient.companyName : "لم يتم اختيار عميل بعد"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedClient?.companyName || "ابدأ بالبحث في القائمة المنسدلة"}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">الخدمات المحددة</p>
                  <p className="mt-2 font-medium">{formatNumber(selectedServices.length)} خدمة</p>
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
                <CardTitle>بيانات العميل الجديد</CardTitle>
                <CardDescription>
                  أدخل بيانات العميل ثم أضف الخدمات المطلوبة.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="companyName">اسم الشركة</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      placeholder="مثال: شركة النخبة"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="businessName">الاسم التجاري</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      placeholder="إن وجد"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contactName">اسم جهة الاتصال</Label>
                    <Input
                      id="contactName"
                      value={contactName}
                      onChange={(event) => setContactName(event.target.value)}
                      placeholder="اسم المسؤول"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phoneWhatsapp">رقم واتساب</Label>
                    <Input
                      id="phoneWhatsapp"
                      value={phoneWhatsapp}
                      onChange={(event) => setPhoneWhatsapp(event.target.value)}
                      placeholder="+212..."
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@company.com"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>نوع النشاط</Label>
                    <Select
                      value={businessType}
                      onValueChange={(value) => setBusinessType(value as BusinessType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع النشاط" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>مصدر العميل</Label>
                  <Select value={source} onValueChange={(value) => setSource(value as ClientSource)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المصدر" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      سيتم إنشاء العميل والطلب والخدمات في خطوة واحدة.
                    </span>
                  </div>
                  <Button onClick={handleNewSubmit} disabled={isSubmitting}>
                    {isCreatingNew ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <PlusCircle data-icon="inline-start" />
                    )}
                    {isCreatingNew ? "جاري الإنشاء" : "إنشاء الطلب"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="gap-2">
                <CardTitle>الخدمات المطلوبة</CardTitle>
                <CardDescription>اختر الخدمات المطلوبة لهذا العميل الجديد.</CardDescription>
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
