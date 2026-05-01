"use client";

import { useState } from "react";
import { 
  useCreatePaymentIntentMutation, 
  useGetPaymentGatewaysQuery,
  useGetBankAccountsQuery 
} from "@/features/finance/financeApi";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Landmark, Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
  invoice: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentModal({ invoice, open, onOpenChange }: PaymentModalProps) {
  const [method, setMethod] = useState<'stripe' | 'bank' | null>(null);
  const { data: gateways } = useGetPaymentGatewaysQuery();
  const { data: bankAccounts } = useGetBankAccountsQuery();
  const [createIntent, { isLoading: isCreatingIntent }] = useCreatePaymentIntentMutation();

  const stripeGateway = gateways?.find(g => g.name === 'stripe' && g.isActive);

  const handleStripePayment = async () => {
    try {
      const response = await createIntent({
        invoiceId: invoice.id,
        gatewayName: 'stripe',
        amount: invoice.amount,
      }).unwrap();

      if (response.clientSecret) {
        window.location.href = response.clientSecret; // redirect to stripe checkout
      } else {
        toast.error("فشل في الحصول على رابط الدفع");
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء بدء عملية الدفع");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-xl">دفع الفاتورة {invoice.invoiceNumber}</DialogTitle>
          <DialogDescription>اختر وسيلة الدفع المفضلة لديك</DialogDescription>
        </DialogHeader>

        {!method ? (
          <div className="grid gap-4 py-4">
            {stripeGateway && (
              <Button 
                variant="outline" 
                className="h-20 justify-between px-6 border-2 hover:border-primary hover:bg-primary/5 group"
                onClick={() => setMethod('stripe')}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <div className="font-bold">بطاقة ائتمان / مدى</div>
                    <div className="text-xs text-muted-foreground">دفع آمن وفوري عبر Stripe</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground rotate-180" />
              </Button>
            )}

            <Button 
              variant="outline" 
              className="h-20 justify-between px-6 border-2 hover:border-primary hover:bg-primary/5 group"
              onClick={() => setMethod('bank')}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100">
                  <Landmark className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-right">
                  <div className="font-bold">تحويل بنكي مباشر</div>
                  <div className="text-xs text-muted-foreground">تحويل للمصرف وتأكيد يدوي</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground rotate-180" />
            </Button>
          </div>
        ) : method === 'stripe' ? (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full animate-pulse">
                <CreditCard className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h4 className="font-bold text-lg">جاري تجهيز بوابة الدفع...</h4>
            <p className="text-sm text-muted-foreground">سيتم توجيهك إلى صفحة الدفع الآمنة الخاصة بـ Stripe لإتمام العملية.</p>
            <div className="pt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setMethod(null)}>رجوع</Button>
              <Button className="flex-1" onClick={handleStripePayment} disabled={isCreatingIntent}>
                {isCreatingIntent && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                تأكيد ومتابعة
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <h4 className="font-bold text-center mb-2">بيانات الحسابات البنكية المعتمدة</h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto px-1">
              {bankAccounts?.map((acc: any) => (
                <div key={acc.id} className="p-4 border rounded-xl bg-muted/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-primary">{acc.bankName}</span>
                    <Landmark className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="grid gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase">اسم الحساب</span>
                    <span className="text-sm font-semibold">{acc.accountName}</span>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase">IBAN</span>
                    <span className="text-sm font-mono bg-white p-2 rounded border select-all text-center">{acc.iban}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-800 leading-relaxed">
              <p className="font-bold mb-1">تعليمات:</p>
              <p>يرجى إرفاق رقم الفاتورة <span className="font-bold">{invoice.invoiceNumber}</span> في ملاحظات التحويل لسرعة التأكيد.</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setMethod(null)}>رجوع</Button>
          </div>
        )}

        <DialogFooter className="sm:justify-start">
          <div className="text-[10px] text-muted-foreground text-center w-full">
            جميع المدفوعات مشفرة وآمنة 100%
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
