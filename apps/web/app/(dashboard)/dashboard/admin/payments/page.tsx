"use client";

import { useState, useEffect } from "react";
import { 
  useGetPaymentGatewaysQuery, 
  useUpdatePaymentGatewayMutation,
  useGetBankAccountsQuery,
  useCreateBankAccountMutation,
  useUpdateBankAccountMutation,
  useDeleteBankAccountMutation
} from "@/features/finance/financeApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/design-system/Checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/design-system/Tabs";
import { toast } from "sonner";
import { CreditCard, Landmark, Plus, Trash2, Save, ShieldCheck } from "lucide-react";
import { Dialog } from "@/components/design-system/Dialog";

export default function PaymentSettingsPage() {
  const { data: gateways, isLoading: isLoadingGateways } = useGetPaymentGatewaysQuery();
  const { data: bankAccounts, isLoading: isLoadingBanks } = useGetBankAccountsQuery();
  
  const [updateGateway] = useUpdatePaymentGatewayMutation();
  const [createBank] = useCreateBankAccountMutation();
  const [deleteBank] = useDeleteBankAccountMutation();

  const [stripeConfig, setStripeConfig] = useState({
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    isActive: false,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (gateways && !isInitialized) {
      const stripe = gateways.find(g => g.name === 'stripe');
      if (stripe) {
        setStripeConfig({
          publishableKey: stripe.configJson?.publishableKey || '',
          secretKey: stripe.configJson?.secretKey || '',
          webhookSecret: stripe.configJson?.webhookSecret || '',
          isActive: stripe.isActive,
        });
        setIsInitialized(true);
      }
    }
  }, [gateways, isInitialized]);

  if (isLoadingGateways || isLoadingBanks) {
    return (
      <div className="p-8 space-y-8 animate-pulse" dir="rtl">
        <div className="h-10 w-48 bg-neutral-50 rounded-md mb-2" />
        <div className="h-4 w-96 bg-neutral-50 rounded-md mb-8" />
        <div className="h-12 w-[400px] bg-neutral-50 rounded-md mb-8" />
        <div className="h-64 w-full bg-neutral-50 rounded-xl" />
      </div>
    );
  }

  const handleSaveStripe = async () => {
    try {
      await updateGateway({ name: 'stripe', body: stripeConfig }).unwrap();
      toast.success("تم تحديث إعدادات Stripe بنجاح");
    } catch (err) {
      toast.error("فشل تحديث الإعدادات");
    }
  };

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">إعدادات الدفع</h1>
        <p className="text-neutral-300">تكوين بوابات الدفع والحسابات البنكية لاستقبال المدفوعات من العملاء</p>
      </div>

      <Tabs defaultValue="online" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
          <TabsTrigger value="online">بوابات الدفع أونلاين</TabsTrigger>
          <TabsTrigger value="manual">التحويل البنكي</TabsTrigger>
        </TabsList>

        <TabsContent value="online" className="space-y-6">
          <SurfaceCard className="border-2 border-secondary-500/10">
            <div className="bg-secondary-500/5 px-6 py-4 border-b border-secondary-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm border">
                  <CreditCard className="w-6 h-6 text-secondary-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Stripe</h3>
                  <p className="text-sm text-neutral-300">قبول المدفوعات عبر بطاقات الائتمان، مدى، و Apple Pay</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm">
                <Checkbox 
                  id="stripe-active" 
                  checked={stripeConfig.isActive}
                  onCheckedChange={(val) => setStripeConfig(prev => ({ ...prev, isActive: !!val }))}
                />
                <Label htmlFor="stripe-active" className="cursor-pointer font-medium">تفعيل البوابة</Label>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Publishable Key</Label>
                  <FormInputControl 
                    value={stripeConfig.publishableKey}
                    onChange={(e) => setStripeConfig(prev => ({ ...prev, publishableKey: e.target.value }))}
                    placeholder="pk_test_..."
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-neutral-300">يستخدم في الواجهة الأمامية لتشفير بيانات البطاقة</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Secret Key</Label>
                  <FormInputControl 
                    type="password"
                    value={stripeConfig.secretKey}
                    onChange={(e) => setStripeConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                    placeholder="sk_test_..."
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-neutral-300">مفتاح سري للاستخدام في الخادم فقط (يتم تشفيره في قاعدة البيانات)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Webhook Secret</Label>
                <div className="flex gap-2">
                  <FormInputControl 
                    type="password"
                    value={stripeConfig.webhookSecret}
                    onChange={(e) => setStripeConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                    placeholder="whsec_..."
                    className="font-mono text-xs"
                  />
                </div>
                <p className="text-[10px] text-neutral-300">يستخدم للتحقق من صحة التنبيهات القادمة من Stripe</p>
              </div>

              <div className="bg-alert-50 border border-alert-100 rounded-lg p-4 flex gap-3 items-start">
                <ShieldCheck className="w-5 h-5 text-alert-600 shrink-0 mt-0.5" />
                <div className="text-xs text-alert-800 leading-relaxed">
                  <p className="font-bold mb-1">تأكد من إعداد Webhook في لوحة تحكم Stripe:</p>
                  <p>رابط الاستقبال: <code className="bg-alert-100 px-1 rounded">https://api.hassad.sa/v1/webhooks/stripe</code></p>
                  <p>الأحداث المطلوبة: <code className="bg-alert-100 px-1 rounded">payment_intent.succeeded</code>, <code className="bg-alert-100 px-1 rounded">payment_intent.payment_failed</code></p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <ActionButton onClick={handleSaveStripe} size="lg" className="px-8">
                  <Save className="w-4 h-4 ml-2" />
                  حفظ إعدادات البوابة
                </ActionButton>
              </div>
            </div>
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">الحسابات البنكية</h3>
              <p className="text-sm text-neutral-300">هذه الحسابات ستظهر للعملاء عند اختيار الدفع بالتحويل البنكي</p>
            </div>
            <AddBankAccountDialog onAdd={(data) => createBank(data)} />
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
                    <div className="text-[10px] text-neutral-300 uppercase tracking-wider mb-1">اسم الحساب</div>
                    <div className="text-sm font-semibold">{account.accountName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-300 uppercase tracking-wider mb-1">رقم الآيبان (IBAN)</div>
                    <div className="text-sm font-mono bg-neutral-50 p-2 rounded-md border text-center select-all">
                      {account.iban}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${account.isActive ? 'bg-success-500' : 'bg-danger-500'}`} />
                      <span className="text-[10px] text-neutral-300">{account.isActive ? 'نشط' : 'متوقف'}</span>
                    </div>
                    <ActionButton 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 text-danger-500 hover:text-danger-500 hover:bg-danger-500/10"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا الحساب؟')) {
                          deleteBank(account.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </ActionButton>
                  </div>
                </div>
              </SurfaceCard>
            ))}

            {bankAccounts?.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-neutral-300 border-2 border-dashed rounded-xl">
                <Landmark className="w-12 h-12 mb-4 opacity-20" />
                <p>لا توجد حسابات بنكية مضافة بعد</p>
                <ActionButton variant="outline" onClick={() => document.getElementById('add-bank-trigger')?.click()}>
                  إضافة أول حساب الآن
                </ActionButton>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AddBankAccountDialog({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({
    bankName: '',
    accountName: '',
    iban: '',
    swiftCode: '',
    isActive: true,
  });

  const handleSubmit = async () => {
    if (!data.bankName || !data.accountName || !data.iban) {
      toast.error("يرجى ملء جميع الحقول الإلزامية");
      return;
    }
    try {
      await onAdd(data).unwrap();
      toast.success("تم إضافة الحساب البنكي بنجاح");
      setOpen(false);
      setData({ bankName: '', accountName: '', iban: '', swiftCode: '', isActive: true });
    } catch (e) {
      toast.error("حدث خطأ أثناء الإضافة");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} title="إضافة حساب بنكي جديد"
      description="أدخل تفاصيل الحساب الذي سيظهر للعملاء في خيار التحويل البنكي"
      contentClassName="sm:max-w-[425px]"
      footer={
        <div className="flex gap-2">
          <ActionButton variant="outline" onClick={() => setOpen(false)}>إلغاء</ActionButton>
          <ActionButton onClick={handleSubmit}>حفظ الحساب</ActionButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label>اسم البنك <span className="text-danger-500">*</span></Label>
          <FormInputControl 
            value={data.bankName} 
            onChange={e => setData({...data, bankName: e.target.value})} 
            placeholder="مثال: مصرف الراجحي"
          />
        </div>
        <div className="grid gap-2">
          <Label>اسم صاحب الحساب <span className="text-danger-500">*</span></Label>
          <FormInputControl 
            value={data.accountName} 
            onChange={e => setData({...data, accountName: e.target.value})} 
            placeholder="الاسم الكامل كما يظهر في البنك"
          />
        </div>
        <div className="grid gap-2">
          <Label>رقم الآيبان (IBAN) <span className="text-danger-500">*</span></Label>
          <FormInputControl 
            value={data.iban} 
            onChange={e => setData({...data, iban: e.target.value})} 
            placeholder="SA..."
            className="font-mono"
          />
        </div>
        <div className="grid gap-2">
          <Label>رمز السويفت (SWIFT Code)</Label>
          <FormInputControl 
            value={data.swiftCode} 
            onChange={e => setData({...data, swiftCode: e.target.value})} 
            placeholder="اختياري"
            className="font-mono"
          />
        </div>
      </div>
    </Dialog>
  );
}
