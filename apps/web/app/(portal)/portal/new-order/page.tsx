import Link from "next/link";
import { ArrowLeft, Headphones, Lightbulb, MessageCircle } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PortalNewOrderPage() {
  return (
    <main dir="rtl" className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Headphones className="size-7" />
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle>تواصل مع مدير حسابك</CardTitle>
            <CardDescription>
              تم إيقاف تقديم الطلبات المباشرة. يمكنك التواصل مع مدير حسابك عبر
              المحادثة المباشرة لطلب خدمة جديدة أو الاستفسار عن أي شيء.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Alert>
            <Lightbulb className="size-4" />
            <AlertTitle>هل تعلم؟</AlertTitle>
            <AlertDescription>
              فريق المبيعات يمكنه إنشاء الطلب نيابة عنك بشكل أسرع، مع ضمان دقة
              المعلومات واختيار الخدمات المناسبة لنشاطك.
            </AlertDescription>
          </Alert>

          <Button asChild size="lg" className="w-full">
            <Link href="/portal/chat?openSales=true">
              <MessageCircle data-icon="inline-start" />
              تواصل مع مدير حسابي
              <ArrowLeft data-icon="inline-end" />
            </Link>
          </Button>

          <Button asChild variant="link" className="w-full">
            <Link href="/portal">العودة إلى لوحة التحكم</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
