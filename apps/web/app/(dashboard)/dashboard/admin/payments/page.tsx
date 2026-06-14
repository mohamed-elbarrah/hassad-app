"use client";

import { useState, useEffect } from "react";
import {
  useGetPaymentGatewaysQuery,
  useUpdatePaymentGatewayMutation,
  useGetBankAccountsQuery,
  useCreateBankAccountMutation,
  useDeleteBankAccountMutation,
} from "@/features/finance/financeApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/design-system/Checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/design-system/Tabs";
import { Dialog } from "@/components/design-system/Dialog";
import { Skeleton } from "@/components/design-system/Skeleton";
import { toast } from "sonner";
import { CreditCard, Landmark, Plus, Trash2, Save, ShieldCheck } from "lucide-react";

export default function PaymentSettingsPage() {
  const { data: gateways, isLoading: isLoadingGateways } = useGetPaymentGatewaysQuery();
  const { data: bankAccounts, isLoading: isLoadingBanks } = useGetBankAccountsQuery();
  const [updateGateway] = useUpdatePaymentGatewayMutation();
  const [createBank] = useCreateBankAccountMutation();
  const [deleteBank] = useDeleteBankAccountMutation();

  const [stripeConfig, setStripeConfig] = useState({
    publishableKey: "", secretKey: "", webhookSecret: "", isActive: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (gateways && !isInitialized) {
      const stripe = gateways.find((g) => g.name === "stripe");
      if (stripe) {
        setStripeConfig({
          publishableKey: stripe.configJson?.publishableKey || "",
          secretKey: stripe.configJson?.secretKey || "",
          webhookSecret: stripe.configJson?.webhookSecret || "",
          isActive: stripe.isActive,
        });
        setIsInitialized(true);
      }
    }
  }, [gateways, isInitialized]);

  const [bankDialogOpen, setBankDialogOpen] = useState(false);

  const isLoading = isLoadingGateways || isLoadingBanks;

  const handleSaveStripe = async () => {
    try {
      await updateGateway({ name: "stripe", body: stripeConfig }).unwrap();
      toast.success("تم تحديث إعدادات Stripe بنجاح");
    } catch { toast.error("فشل تحديث الإعدادات"); }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="إعدادات الدفع"
        description="تكوين بوابات الدفع والحسابات البنكية لاستقبال المدفوعات من العملاء"
        icon={CreditCard}
      />

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-[400px] rounded-xl" />
          <Skeleton className="h-64 w-full rounded-[30px]" />
        </div>
      ) : (
        <Tabs defaultValue="online" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
            <TabsTrigger value="online">بوابات الدفع أونلاين</TabsTrigger>
            <TabsTrigger value="manual">التحويل البنكي</TabsTrigger>
          </TabsList>

          <TabsContent value="online" className="space-y-6">
            <SurfaceCard className="border-2 border-secondary-500/10">
              <div className="bg-secondary-500/5 px-6 py-4 border-b border-secondary-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-natural-0 rounded-xl shadow-sm border border-portal-card-border">
                    <CreditCard className="w-6 h-6 text-secondary-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-natural-100">Stripe</h3>
                    <p className="text-sm text-portal-note-text">قبول المدفوعات عبر بطاقات الائتمان، مدى، و Apple Pay</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-natural-0 px-3 py-1.5 rounded-full border border-portal-card-border shadow-sm">
                  <Checkbox id="stripe-active" checked={stripeConfig.isActive} onCheckedChange={(val) => setStripeConfig((prev) => ({ ...prev, isActive: !!val }))} />
                  <Label htmlFor="stripe-active" className="cursor-pointer font-medium text-natural-100">تفعيل البوابة</Label>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-natural-100">Publishable Key</Label>
                    <FormInputControl value={stripeConfig.publishableKey} onChange={(e) => setStripeConfig((prev) => ({ ...prev, publishableKey: e.target.value }))} placeholder="pk_test_..." className="font-mono text-xs" />
                    <p className="text-[10px] text-portal-note-text">يستخدم في الواجهة الأمامية لتشفير بيانات البطاقة</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-natural-100">Secret Key</Label>
                    <FormInputControl type="password" value={stripeConfig.secretKey} onChange={(e) => setStripeConfig((prev) => ({ ...prev, secretKey: e.target.value }))} placeholder="sk_test_..." className="font-mono text-xs" />
                    <p className="text-[10px] text-portal-note-text">مفتاح سري للاستخدام في الخادم فقط (يتم تشفيره في قاعدة البيانات)</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-natural-100">Webhook Secret</Label>
                  <FormInputControl type="password" value={stripeConfig.webhookSecret} onChange={(e) => setStripeConfig((prev) => ({ ...prev, webhookSecret: e.target.value }))} placeholder="whsec_..." className="font-mono text-xs" />
                  <p className="text-[10px] text-portal-note-text">يستخدم للتحقق من صحة التنبيهات القادمة من Stripe</p>
                </div>

                <div className="bg-alert-50 border border-alert-100 rounded-2xl p-4 flex gap-3 items-start">
                  <ShieldCheck className="w-5 h-5 text-alert-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-alert-800 leading-relaxed">
                    <p className="font-bold mb-1">تأكد من إعداد Webhook في لوحة تحكم Stripe:</p>
                    <p>رابط الاستقبال: <code className="bg-alert-100 px-1 rounded">https://api.hassad.sa/v1/webhooks/stripe</code></p>
                    <p>الأحداث المطلوبة: <code className="bg-alert-100 px-1 rounded">payment_intent.succeeded</code>, <code className="bg-alert-100 px-1 rounded">payment_intent.payment_failed</code></p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <ActionButton onClick={handleSaveStripe} size="lg" className="px-8">
                    <Save className="w-4 h-4 ml-2" />حفظ إعدادات البوابة
                  </ActionButton>
                </div>
              </div>
            </SurfaceCard>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-natural-100">الحسابات البنكية</h3>
                <p className="text-sm text-portal-note-text">هذه الحسابات ستظهر للعملاء عند اختيار الدفع بالتحويل البنكي</p>
              </div>
              <div className="flex items-center gap-2">
                <ActionButton onClick={() => setBankDialogOpen(true)}>
                  <Plus className="size-4 mr-1" />إضافة حساب
                </ActionButton>
                <AddBankAccountDialog open={bankDialogOpen} onOpenChange={setBankDialogOpen} onAdd={(data) => createBank(data)} />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bankAccounts?.map((account) => (
                <SurfaceCard key={account.id} className="relative group hover:border-secondary-500/50 transition-colors">
                  <div className="pb-2">
                    <div className="flex items-center gap-2 text-secondary-500">
                      <Landmark className="w-4 h-4" />
                      <h2 className="text-sm font-bold">{account.bankName}</h2>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] text-portal-note-text uppercase tracking-wider mb-1">اسم الحساب</div>
                      <div className="text-sm font-semibold text-natural-100">{account.accountName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-portal-note-text uppercase tracking-wider mb-1">رقم الآيبان (IBAN)</div>
                      <div className="text-sm font-mono bg-portal-bg p-2 rounded-xl border text-center select-all text-natural-100">{account.iban}</div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${account.isActive ? "bg-success-500" : "bg-danger-500"}`} />
                        <span className="text-[10px] text-portal-note-text">{account.isActive ? "نشط" : "متوقف"}</span>
                      </div>
                      <ActionButton variant="ghost" size="sm" className="h-8 w-8 text-danger-500 hover:text-danger-500 hover:bg-danger-500/10" onClick={() => { if (confirm("هل أنت متأكد من حذف هذا الحساب؟")) deleteBank(account.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </ActionButton>
                    </div>
                  </div>
                </SurfaceCard>
              ))}

              {bankAccounts?.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-portal-note-text border-2 border-dashed border-portal-card-border rounded-2xl">
                  <Landmark className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-base">لا توجد حسابات بنكية مضافة بعد</p>
                  <ActionButton variant="outline" className="mt-4" onClick={() => setBankDialogOpen(true)}>
                    إضافة أول حساب الآن
                  </ActionButton>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function AddBankAccountDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (open: boolean) => void; onAdd: (data: any) => any }) {
  const [data, setData] = useState({ bankName: "", accountName: "", iban: "", swiftCode: "", isActive: true });

  const handleSubmit = async () => {
    if (!data.bankName || !data.accountName || !data.iban) {
      toast.error("يرجى ملء جميع الحقول الإلزامية"); return;
    }
    try {
      await onAdd(data).unwrap();
      toast.success("تم إضافة الحساب البنكي بنجاح");
      onOpenChange(false);
      setData({ bankName: "", accountName: "", iban: "", swiftCode: "", isActive: true });
    } catch { toast.error("حدث خطأ أثناء الإضافة"); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="إضافة حساب بنكي جديد" description="أدخل تفاصيل الحساب الذي سيظهر للعملاء في خيار التحويل البنكي" contentClassName="sm:max-w-[425px]"
        footer={
          <div className="flex gap-2">
            <ActionButton variant="outline" onClick={() => onOpenChange(false)}>إلغاء</ActionButton>
            <ActionButton onClick={handleSubmit}>حفظ الحساب</ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label className="text-natural-100">اسم البنك <span className="text-danger-500">*</span></Label>
            <FormInputControl value={data.bankName} onChange={(e) => setData({ ...data, bankName: e.target.value })} placeholder="مثال: مصرف الراجحي" />
          </div>
          <div className="grid gap-2">
            <Label className="text-natural-100">اسم صاحب الحساب <span className="text-danger-500">*</span></Label>
            <FormInputControl value={data.accountName} onChange={(e) => setData({ ...data, accountName: e.target.value })} placeholder="الاسم الكامل كما يظهر في البنك" />
          </div>
          <div className="grid gap-2">
            <Label className="text-natural-100">رقم الآيبان (IBAN) <span className="text-danger-500">*</span></Label>
            <FormInputControl value={data.iban} onChange={(e) => setData({ ...data, iban: e.target.value })} placeholder="SA..." className="font-mono" />
          </div>
          <div className="grid gap-2">
            <Label className="text-natural-100">رمز السويفت (SWIFT Code)</Label>
            <FormInputControl value={data.swiftCode} onChange={(e) => setData({ ...data, swiftCode: e.target.value })} placeholder="اختياري" className="font-mono" />
          </div>
        </div>
      </Dialog>
  );
}
