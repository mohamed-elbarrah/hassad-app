"use client";

import { useState } from "react";
import { CreditCard, Landmark, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StateBlock } from "@/components/patterns/state-block";
import { useLocale } from "@/components/app/locale-provider";
import {
  type AiProvider,
  type BankAccount,
  type BankAccountInput,
  type CurrencySetting,
  type Gateway,
  useCreateAdminAiProviderMutation,
  useCreateAdminBankAccountMutation,
  useCreateAdminCurrencyMutation,
  useCreateAdminPaymentSettingsMutation,
  useDeleteAdminAiProviderMutation,
  useDeleteAdminBankAccountMutation,
  useDeleteAdminCurrencyMutation,
  useDeleteAdminPaymentSettingsMutation,
  useFetchAdminAiModelsMutation,
  useGetAdminAiProvidersQuery,
  useGetAdminCurrenciesQuery,
  useGetAdminPaymentSettingsQuery,
  useSaveAdminPaymentSettingsMutation,
  useTestAdminAiProviderMutation,
  useUpdateAdminAiProviderMutation,
  useUpdateAdminBankAccountMutation,
  useUpdateAdminCurrencyMutation,
  useUploadAdminCurrencySvgMutation,
} from "@/lib/api/admin-configuration-api";

type Mode = "payments" | "currencies" | "ai";
type Copy = Record<string, string>;
const copy = {
  en: { payments: "Payment methods", method: "Method", onlinePayments: "Online card payments", currencies: "Currencies", ai: "AI providers", paymentsDesc: "Manage online payments and bank-transfer accounts.", currenciesDesc: "Manage the currencies available to the organization.", aiDesc: "Configure supported providers, keys, models, and fallback priority.", add: "Add", edit: "Edit", save: "Save", cancel: "Cancel", remove: "Remove", active: "Active", inactive: "Inactive", configured: "Configured", notConfigured: "Not configured", name: "Name", code: "Code", symbol: "Symbol", symbolType: "Symbol type", textSymbol: "Text symbol", svgUrl: "Uploaded SVG", svgInline: "Inline SVG", svgUpload: "Upload SVG", preview: "Preview", symbolRequired: "A fallback symbol is required for every currency.", defaultDescription: "Used by default for invoices and payment gateways.", activeDescription: "Available for invoices and payment gateways.", default:  "Default", provider: "Provider", apiKey: "API key", displayName: "Display name", priority: "Priority", models: "Models", test: "Test", bankAccounts: "Bank accounts", bankTransfer: "Bank transfer", accountName: "Account name", accountNumber: "Account number", iban: "IBAN", bankName: "Bank name", swiftCode: "SWIFT code", instructions: "Payment instructions", uploadSvg: "Upload SVG", noData: "No records found.", loading: "Loading…", error: "Unable to load settings.", confirmRemove: "Remove this record?", fetchModels: "Fetch models", selectModels: "Select models", noModels: "Fetch models before saving.", testSuccess: "Provider test succeeded.", optional: "Optional", secretHelp: "Keys are encrypted and masked after saving." },
  ar: { payments: "طرق الدفع", method: "طريقة الدفع", onlinePayments: "الدفع الإلكتروني بالبطاقات", currencies: "العملات", ai: "مزودو الذكاء الاصطناعي", paymentsDesc: "إدارة الدفع الإلكتروني وحسابات التحويل البنكي.", currenciesDesc: "إدارة العملات المتاحة للمؤسسة.", aiDesc: "تهيئة المزودين المدعومين والمفاتيح والنماذج وترتيب البدائل.", add: "إضافة", edit: "تعديل", save: "حفظ", cancel: "إلغاء", remove: "حذف", active: "نشط", inactive: "غير نشط", configured: "مهيأ", notConfigured: "غير مهيأ", name: "الاسم", code: "الرمز", symbol: "الرمز", symbolType: "نوع الرمز", textSymbol: "رمز نصي", svgUrl: "SVG مرفوع", svgInline: "SVG مضمن", svgUpload: "رفع SVG", preview: "المعاينة", symbolRequired: "الرمز الاحتياطي مطلوب لكل عملة.", defaultDescription: "يُستخدم افتراضياً للفواتير وبوابات الدفع.", activeDescription: "متاح للفواتير وبوابات الدفع.", default:  "افتراضي", provider: "المزود", apiKey: "مفتاح API", displayName: "اسم العرض", priority: "الأولوية", models: "النماذج", test: "اختبار", bankAccounts: "الحسابات البنكية", bankTransfer: "تحويل بنكي", accountName: "اسم الحساب", accountNumber: "رقم الحساب", iban: "IBAN", bankName: "اسم البنك", swiftCode: "رمز SWIFT", instructions: "تعليمات الدفع", uploadSvg: "رفع SVG", noData: "لا توجد سجلات.", loading: "جارٍ التحميل…", error: "تعذر تحميل الإعدادات.", confirmRemove: "هل تريد حذف هذا السجل؟", fetchModels: "جلب النماذج", selectModels: "اختيار النماذج", noModels: "اجلب النماذج قبل الحفظ.", testSuccess: "نجح اختبار المزود.", optional: "اختياري", secretHelp: "تُشفّر المفاتيح وتظهر بشكل مخفي بعد الحفظ." },
} as const;

export function AdminSettingsWorkspace({ mode }: { mode: Mode }) {
  const { locale } = useLocale();
  const t: Copy = copy[locale];
  const title = mode === "payments" ? t.payments : mode === "currencies" ? t.currencies : t.ai;
  const description = mode === "payments" ? t.paymentsDesc : mode === "currencies" ? t.currenciesDesc : t.aiDesc;
  return <PageScaffold title={title} description={description}>{mode === "payments" ? <PaymentsSettings t={t} /> : mode === "currencies" ? <CurrenciesSettings t={t} /> : <AiSettings t={t} />}</PageScaffold>;
}

function SettingsDialog({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: React.ReactNode }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="w-[calc(100%-2rem)] max-w-2xl overflow-x-hidden max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{title}</DialogTitle>{description && <DialogDescription>{description}</DialogDescription>}</DialogHeader>{children}</DialogContent></Dialog>;
}

function PaymentsSettings({ t }: { t: Copy }) {
  const query = useGetAdminPaymentSettingsQuery();
  const [save] = useSaveAdminPaymentSettingsMutation();
  const [createGateway] = useCreateAdminPaymentSettingsMutation();
  const [removeGateway] = useDeleteAdminPaymentSettingsMutation();
  const [createAccount] = useCreateAdminBankAccountMutation();
  const [updateAccount] = useUpdateAdminBankAccountMutation();
  const [removeAccount] = useDeleteAdminBankAccountMutation();
  const [paymentDialog, setPaymentDialog] = useState<Gateway | null>(null);
  const [accountDialog, setAccountDialog] = useState<BankAccount | "new" | null>(null);
  const [tab, setTab] = useState<"methods" | "accounts">("methods");
  if (query.isLoading) return <StateBlock title={t.loading} description="" />;
  if (query.isError || !query.data) return <StateBlock title={t.error} description="" />;
  const { gateways, bankTransfer, bankAccounts } = query.data;
  const options = [...gateways, ...(bankTransfer ? [bankTransfer] : [])];

  return <Card>
    <CardHeader className="pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(value) => setTab(value as "methods" | "accounts")}>
          <TabsList>
            <TabsTrigger value="methods">{t.payments}</TabsTrigger>
            <TabsTrigger value="accounts">{t.bankAccounts}</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === "accounts" && <Button onClick={() => setAccountDialog("new")}><Plus data-icon="inline-start" />{t.add}</Button>}
      </div>
    </CardHeader>
    <CardContent className="pt-4">
      <Tabs value={tab} onValueChange={(value) => setTab(value as "methods" | "accounts")}>
        <TabsContent value="methods" className="mt-4">
          <Table><TableHeader><TableRow><TableHead>{t.method}</TableHead><TableHead>{t.configured}</TableHead><TableHead>{t.active}</TableHead><TableHead /></TableRow></TableHeader><TableBody>{options.map((gateway) => <TableRow key={gateway.id}><TableCell><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">{gateway.name === "bank_transfer" ? <Landmark /> : <CreditCard />}</div><div><p className="font-medium">{gateway.name === "bank_transfer" ? t.bankTransfer : gateway.name}</p><p className="text-xs text-muted-foreground">{gateway.name === "bank_transfer" ? t.bankAccounts : t.onlinePayments}</p></div></div></TableCell><TableCell>{gateway.name === "bank_transfer" ? `${bankAccounts.filter((account) => account.isActive).length} ${t.active}` : gateway.configJson?.isConfigured ? t.configured : t.notConfigured}</TableCell><TableCell><Switch checked={gateway.isActive} onCheckedChange={(isActive) => void save({ name: gateway.name, isActive })} aria-label={`${gateway.name} ${t.active}`} /></TableCell><TableCell className="flex justify-end gap-2">{gateway.name === "bank_transfer" ? <Button variant="outline" size="sm" onClick={() => setTab("accounts")}>{t.bankAccounts}</Button> : <><Button variant="outline" size="sm" onClick={() => setPaymentDialog(gateway)}>{t.edit}</Button><Button variant="destructive" size="sm" onClick={() => { if (window.confirm(t.confirmRemove)) void removeGateway(gateway.name); }}>{t.remove}</Button></>}</TableCell></TableRow>)}</TableBody></Table>
          {options.length === 0 && <StateBlock title={t.noData} description="" />}
        </TabsContent>
        <TabsContent value="accounts" className="mt-4">
          <Table><TableHeader><TableRow><TableHead>{t.accountName}</TableHead><TableHead>{t.bankName}</TableHead><TableHead>{t.iban}</TableHead><TableHead>{t.active}</TableHead><TableHead /></TableRow></TableHeader><TableBody>{bankAccounts.map((account) => <TableRow key={account.id}><TableCell>{account.accountName}</TableCell><TableCell>{account.bankName}</TableCell><TableCell>{account.iban}</TableCell><TableCell><Switch checked={account.isActive} onCheckedChange={(isActive) => void updateAccount({ id: account.id, body: { isActive } })} aria-label={`${account.accountName} ${t.active}`} /></TableCell><TableCell className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setAccountDialog(account)}>{t.edit}</Button><Button variant="destructive" size="sm" onClick={() => { if (window.confirm(t.confirmRemove)) void removeAccount(account.id); }}>{t.remove}</Button></TableCell></TableRow>)}</TableBody></Table>
          {bankAccounts.length === 0 && <StateBlock title={t.noData} description="" />}
        </TabsContent>
      </Tabs>
    </CardContent>
    <GatewayDialog t={t} gateway={paymentDialog} onClose={() => setPaymentDialog(null)} onSave={(body) => { const result = paymentDialog?.id === "new" ? createGateway(body) : save(body); void result.then(() => setPaymentDialog(null)); }} />
    <BankAccountDialog t={t} account={accountDialog} onClose={() => setAccountDialog(null)} onSave={(body) => { const result = accountDialog === "new" ? createAccount(body as BankAccountInput) : updateAccount({ id: accountDialog!.id, body }); void result.then(() => setAccountDialog(null)); }} />
  </Card>;
}

function GatewayDialog({ t, gateway, onClose, onSave }: { t: Copy; gateway: Gateway | null; onClose: () => void; onSave: (body: { name: string; secretKey?: string; webhookSecret?: string; publishableKey?: string; isActive?: boolean }) => void }) {
  const [secretKey, setSecretKey] = useState(""); const [webhookSecret, setWebhookSecret] = useState(""); const [publishableKey, setPublishableKey] = useState("");
  const isBank = gateway?.name === "bank_transfer";
  return <SettingsDialog open={!!gateway} onOpenChange={(open) => !open && onClose()} title={`${gateway?.id === "new" ? t.add : t.edit} ${isBank ? t.bankTransfer : gateway?.name ?? t.provider}`} description={isBank ? t.instructions : t.secretHelp}><FieldGroup>{!isBank && <><Field><FieldLabel>{t.apiKey}</FieldLabel><Input type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} /></Field><Field><FieldLabel>Webhook secret</FieldLabel><Input type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} /></Field><Field><FieldLabel>Publishable key</FieldLabel><Input value={publishableKey} onChange={(e) => setPublishableKey(e.target.value)} /></Field></>}</FieldGroup><DialogFooter><Button variant="outline" onClick={onClose}>{t.cancel}</Button><Button onClick={() => gateway && onSave({ name: gateway.name, secretKey: secretKey || undefined, webhookSecret: webhookSecret || undefined, publishableKey: publishableKey || undefined, isActive: true })}>{t.save}</Button></DialogFooter></SettingsDialog>;
}

function BankAccountDialog({ t, account, onClose, onSave }: { t: Copy; account: BankAccount | "new" | null; onClose: () => void; onSave: (body: Partial<BankAccount>) => void }) {
  const [form, setForm] = useState<Partial<BankAccount>>({});
  const update = (key: keyof BankAccount, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  return <SettingsDialog open={!!account} onOpenChange={(open) => !open && onClose()} title={`${account === "new" ? t.add : t.edit} ${t.bankAccounts}`}><FieldGroup><Field><FieldLabel>{t.accountName}</FieldLabel><Input value={form.accountName ?? (account !== "new" ? account?.accountName : "")} onChange={(e) => update("accountName", e.target.value)} /></Field><Field><FieldLabel>{t.bankName}</FieldLabel><Input value={form.bankName ?? (account !== "new" ? account?.bankName : "")} onChange={(e) => update("bankName", e.target.value)} /></Field><Field><FieldLabel>{t.iban}</FieldLabel><Input value={form.iban ?? (account !== "new" ? account?.iban : "")} onChange={(e) => update("iban", e.target.value)} /></Field><Field><FieldLabel>{t.accountNumber}</FieldLabel><Input value={form.accountNumber ?? (account !== "new" ? account?.accountNumber ?? "" : "")} onChange={(e) => update("accountNumber", e.target.value)} /></Field><Field><FieldLabel>{t.swiftCode}</FieldLabel><Input value={form.swiftCode ?? (account !== "new" ? account?.swiftCode ?? "" : "")} onChange={(e) => update("swiftCode", e.target.value)} /></Field><Field><FieldLabel>{t.instructions}</FieldLabel><Input value={form.instructions ?? (account !== "new" ? account?.instructions ?? "" : "")} onChange={(e) => update("instructions", e.target.value)} /></Field></FieldGroup><DialogFooter><Button variant="outline" onClick={onClose}>{t.cancel}</Button><Button onClick={() => onSave({ ...form, isActive: form.isActive ?? true } as Partial<BankAccount>)}>{t.save}</Button></DialogFooter></SettingsDialog>;
}

function CurrenciesSettings({ t }: { t: Copy }) {
  const query = useGetAdminCurrenciesQuery(); const [create] = useCreateAdminCurrencyMutation(); const [update] = useUpdateAdminCurrencyMutation(); const [remove] = useDeleteAdminCurrencyMutation(); const [dialog, setDialog] = useState<CurrencySetting | "new" | null>(null);
  if (query.isLoading) return <StateBlock title={t.loading} description="" />; if (query.isError || !query.data) return <StateBlock title={t.error} description="" />;
  const currencies = query.data;
  return <Card><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{t.currencies}</CardTitle><CardDescription>{t.currenciesDesc}</CardDescription></div><Button onClick={() => setDialog("new")}>{t.add}</Button></div></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>{t.code}</TableHead><TableHead>{t.name}</TableHead><TableHead className="hidden md:table-cell">{t.symbol}</TableHead><TableHead className="hidden md:table-cell">{t.default}</TableHead><TableHead>{t.active}</TableHead><TableHead /></TableRow></TableHeader><TableBody>{currencies.map((currency) => <TableRow key={currency.id}><TableCell className="font-medium">{currency.code}</TableCell><TableCell>{currency.name}</TableCell><TableCell className="hidden md:table-cell"><CurrencyPreview currency={currency} /></TableCell><TableCell className="hidden md:table-cell">{currency.isDefault ? "✓" : "—"}</TableCell><TableCell><Switch checked={currency.isActive} onCheckedChange={(isActive) => void update({ id: currency.id, body: { isActive } })} aria-label={`${currency.code} ${t.active}`} /></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDialog(currency)}>{t.edit}</Button><Button variant="destructive" size="sm" disabled={currency.isDefault} onClick={() => { if (window.confirm(t.confirmRemove)) void remove(currency.id); }}>{t.remove}</Button></div></TableCell></TableRow>)}</TableBody></Table>{currencies.length === 0 && <StateBlock title={t.noData} description="" />}</CardContent><CurrencyDialog t={t} currency={dialog} onClose={() => setDialog(null)} onSave={(body) => { const result = dialog === "new" ? create(body) : update({ id: dialog!.id, body }); void result.then(() => setDialog(null)); }} /></Card>;
}

function CurrencyPreview({ currency }: { currency: CurrencySetting }) {
  if (currency.symbolType === "SVG_URL" && currency.svgUrl) return <img src={currency.svgUrl} alt={currency.code} className="size-6 object-contain" />;
  if (currency.symbolType === "SVG_INLINE" && currency.svgKey) return <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(currency.svgKey)}`} alt={currency.code} className="size-6 object-contain" />;
  return <span className="font-medium">{currency.symbol}</span>;
}

function CurrencyDialog({ t, currency, onClose, onSave }: { t: Copy; currency: CurrencySetting | "new" | null; onClose: () => void; onSave: (body: Partial<CurrencySetting>) => void }) {
  const [upload, uploadState] = useUploadAdminCurrencySvgMutation();
  const [form, setForm] = useState<Partial<CurrencySetting>>({});
  const set = (key: keyof CurrencySetting, value: string | number | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const value = (key: keyof CurrencySetting) => form[key] ?? (currency !== "new" && currency ? currency[key] : undefined);
  const symbolType = String(value("symbolType") ?? "TEXT") as CurrencySetting["symbolType"];
  const symbol = String(value("symbol") ?? "");
  const svgValue = String(value("svgKey") ?? "");
  const svgUrl = String(value("svgUrl") ?? "");
  const previewSource = symbolType === "SVG_URL" ? svgUrl : symbolType === "SVG_INLINE" && svgValue ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgValue)}` : "";
  const valid = Boolean(String(value("code") ?? "").trim() && String(value("name") ?? "").trim() && symbol.trim() && ((symbolType === "TEXT") || svgValue.trim()));

  return <SettingsDialog open={!!currency} onOpenChange={(open) => !open && onClose()} title={`${currency === "new" ? t.add : t.edit} ${t.currencies}`} description={t.symbolRequired}>
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_13rem]">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field><FieldLabel>{t.code}</FieldLabel><Input required maxLength={3} value={value("code") as string ?? ""} onChange={(e) => set("code", e.target.value.toUpperCase())} /></Field>
          <Field><FieldLabel>{t.name}</FieldLabel><Input required value={value("name") as string ?? ""} onChange={(e) => set("name", e.target.value)} /></Field>
        </div>
        <Field><FieldLabel>{t.symbol}</FieldLabel><Input required value={symbol} onChange={(e) => set("symbol", e.target.value)} /><FieldDescription>{t.symbolRequired}</FieldDescription></Field>
        <Field><FieldLabel>{t.symbolType}</FieldLabel><Select value={symbolType} onValueChange={(next) => set("symbolType", next ?? "TEXT")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="TEXT">{t.textSymbol}</SelectItem><SelectItem value="SVG_URL">{t.svgUrl}</SelectItem><SelectItem value="SVG_INLINE">{t.svgInline}</SelectItem></SelectGroup></SelectContent></Select></Field>
        {symbolType === "SVG_URL" && <Field><FieldLabel>{t.svgUpload}</FieldLabel><Input type="file" accept="image/svg+xml" disabled={uploadState.isLoading} onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file).then((result) => { if ("data" in result && result.data) setForm((current) => ({ ...current, svgKey: result.data.key, svgUrl: result.data.url, symbolType: "SVG_URL" })); }); }} /><FieldDescription>{t.svgUrl}</FieldDescription></Field>}
        {symbolType === "SVG_INLINE" && <Field><FieldLabel>{t.svgInline}</FieldLabel><Textarea required rows={6} value={symbolType === "SVG_INLINE" ? svgValue : ""} onChange={(e) => set("svgKey", e.target.value)} placeholder={'<svg viewBox="0 0 24 24">…</svg>'} /><FieldDescription>{t.svgInline}</FieldDescription></Field>}
        <div className="grid gap-4 rounded-lg border bg-muted/20 p-4"><Field><div className="flex items-center justify-between gap-3"><FieldLabel>{t.default}</FieldLabel><Switch checked={Boolean(value("isDefault"))} onCheckedChange={(checked) => { set("isDefault", checked); if (checked) set("isActive", true); }} /></div><FieldDescription>{t.defaultDescription}</FieldDescription></Field><Field><div className="flex items-center justify-between gap-3"><FieldLabel>{t.active}</FieldLabel><Switch disabled={Boolean(value("isDefault"))} checked={currency === "new" ? Boolean(value("isActive") ?? true) : Boolean(value("isActive"))} onCheckedChange={(checked) => set("isActive", checked)} /></div><FieldDescription>{t.activeDescription}</FieldDescription></Field></div>
      </FieldGroup>
      <div className="flex min-w-0 flex-col gap-3 rounded-xl border bg-muted/20 p-4"><p className="text-sm font-medium">{t.preview}</p><div className="flex min-h-36 items-center justify-center rounded-lg border bg-background p-4">{previewSource ? <img src={previewSource} alt={t.preview} className="size-20 object-contain" /> : <span className="text-5xl font-semibold text-foreground">{symbol || "¤"}</span>}</div><div className="flex flex-col gap-1 text-center"><span className="text-sm font-medium">{symbol || "¤"} 1,234.56</span><span className="text-xs text-muted-foreground">{String(value("code") ?? "CUR")} · {String(value("name") ?? t.currencies)}</span></div></div>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>{t.cancel}</Button><Button disabled={!valid} onClick={() => onSave(form)}>{t.save}</Button></DialogFooter>
  </SettingsDialog>;
}

function AiSettings({ t }: { t: Copy }) {
  const query = useGetAdminAiProvidersQuery(); const [create] = useCreateAdminAiProviderMutation(); const [update] = useUpdateAdminAiProviderMutation(); const [remove] = useDeleteAdminAiProviderMutation(); const [test] = useTestAdminAiProviderMutation(); const [dialog, setDialog] = useState<AiProvider | "new" | null>(null);
  if (query.isLoading) return <StateBlock title={t.loading} description="" />; if (query.isError || !query.data) return <StateBlock title={t.error} description="" />;
  return <Card><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{t.ai}</CardTitle><CardDescription>{t.aiDesc}</CardDescription></div><Button onClick={() => setDialog("new")}>{t.add}</Button></div></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>{t.provider}</TableHead><TableHead>{t.apiKey}</TableHead><TableHead>{t.models}</TableHead><TableHead>{t.priority}</TableHead><TableHead>{t.active}</TableHead><TableHead /></TableRow></TableHeader><TableBody>{query.data.map((provider) => <TableRow key={provider.id}><TableCell>{provider.displayName || provider.name}</TableCell><TableCell>{provider.apiKey}</TableCell><TableCell className="max-w-64 truncate">{provider.models.join(", ") || "—"}</TableCell><TableCell>{provider.priority}</TableCell><TableCell><Switch checked={provider.isActive} onCheckedChange={(isActive) => void update({ id: provider.id, body: { isActive } })} aria-label={`${provider.name} ${t.active}`} /></TableCell><TableCell className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => void test(provider.id)}>{t.test}</Button><Button variant="outline" size="sm" onClick={() => setDialog(provider)}>{t.edit}</Button><Button variant="destructive" size="sm" onClick={() => { if (window.confirm(t.confirmRemove)) void remove(provider.id); }}>{t.remove}</Button></TableCell></TableRow>)}</TableBody></Table>{query.data.length === 0 && <StateBlock title={t.noData} description="" />}</CardContent><AiProviderDialog t={t} provider={dialog} onClose={() => setDialog(null)} onSave={(body) => { const result = dialog === "new" ? create({ ...body, apiKey: body.apiKey ?? "" }) : update({ id: dialog!.id, body }); void result.then(() => setDialog(null)); }} /></Card>;
}

function AiProviderDialog({ t, provider, onClose, onSave }: { t: Copy; provider: AiProvider | "new" | null; onClose: () => void; onSave: (body: Partial<AiProvider> & { apiKey?: string }) => void }) {
  const [fetchModels] = useFetchAdminAiModelsMutation(); const [form, setForm] = useState<Partial<AiProvider> & { apiKey?: string }>({}); const [availableModels, setAvailableModels] = useState<string[]>(provider !== "new" && provider ? provider.models : []); const [selectedModels, setSelectedModels] = useState<string[]>(provider !== "new" && provider ? provider.models : []); const set = (key: string, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  const providerName = String(form.name ?? (provider !== "new" ? provider?.name : "openai"));
  return <SettingsDialog open={!!provider} onOpenChange={(open) => !open && onClose()} title={`${provider === "new" ? t.add : t.edit} ${t.provider}`} description={t.secretHelp}><FieldGroup><Field><FieldLabel>{t.provider}</FieldLabel><Select value={providerName} onValueChange={(value) => set("name", value ?? "openai")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["openai", "openrouter", "anthropic", "google"].map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><Field><FieldLabel>{t.apiKey}</FieldLabel><Input type="password" value={form.apiKey ?? ""} onChange={(e) => set("apiKey", e.target.value)} /></Field><Field><FieldLabel>{t.displayName}</FieldLabel><Input value={form.displayName ?? (provider !== "new" ? provider?.displayName ?? "" : "")} onChange={(e) => set("displayName", e.target.value)} /></Field><Button type="button" variant="outline" onClick={() => void fetchModels({ name: providerName, apiKey: form.apiKey ?? "" }).then((result) => { if ("data" in result && result.data) { setAvailableModels(result.data.models); setSelectedModels((current) => current.filter((model) => result.data.models.includes(model))); } })}>{t.fetchModels}</Button>{availableModels.length > 0 && <Field><FieldLabel>{t.selectModels}</FieldLabel><div className="grid gap-2">{availableModels.map((model) => <label key={model} className="flex items-center gap-2"><Checkbox checked={selectedModels.includes(model)} onCheckedChange={(checked) => setSelectedModels((current) => checked ? [...current, model] : current.filter((item) => item !== model))} /><span>{model}</span></label>)}</div></Field>}<Field><FieldLabel>{t.priority}</FieldLabel><Input type="number" value={form.priority ?? (provider !== "new" ? provider?.priority ?? 0 : 0)} onChange={(e) => set("priority", Number(e.target.value))} /></Field></FieldGroup><DialogFooter><Button variant="outline" onClick={onClose}>{t.cancel}</Button><Button disabled={selectedModels.length === 0} onClick={() => onSave({ ...form, name: providerName, models: selectedModels })}>{t.save}</Button></DialogFooter></SettingsDialog>;
}
