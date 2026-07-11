import Link from "next/link";
import { MessageCircle, ArrowLeft, Headphones } from "lucide-react";

export default function PortalNewOrderPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center" dir="rtl">
      <div className="max-w-md w-full text-center space-y-8 px-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-secondary-50 flex items-center justify-center">
          <Headphones className="w-10 h-10 text-secondary-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-natural-100">
            تواصل مع مدير حسابك
          </h1>
          <p className="text-neutral-400 leading-relaxed">
            تم إيقاف تقديم الطلبات المباشرة. يمكنك التواصل مع مدير حسابك عبر
            المحادثة المباشرة لطلب خدمة جديدة أو الاستفسار عن أي شيء.
          </p>
        </div>

        <div className="bg-alert-100 border border-alert-200 rounded-2xl p-4 text-right">
          <p className="text-sm text-alert-700 font-medium">💡 هل تعلم؟</p>
          <p className="text-sm text-alert-600 mt-1 leading-relaxed">
            فريق المبيعات يمكنه إنشاء الطلب نيابة عنك بشكل أسرع، مع ضمان دقة
            المعلومات واختيار الخدمات المناسبة لنشاطك.
          </p>
        </div>

        <Link
          href="/portal/chat?openSales=true"
          className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-2xl bg-secondary-500 hover:bg-secondary-600 text-white font-semibold transition-colors w-full"
        >
          <MessageCircle className="w-5 h-5" />
          تواصل مع مدير حسابي
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <Link
          href="/portal"
          className="inline-flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-natural-100 transition-colors"
        >
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
}
