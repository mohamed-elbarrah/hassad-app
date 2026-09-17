import Image from "next/image";
import Link from "next/link";
import { BriefcaseBusiness, FileText, FolderKanban } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  WhatsAppSupportButton,
  WhatsAppSupportSection,
} from "@/components/home/WhatsAppSupport";

const features = [
  {
    icon: FileText,
    title: "العروض",
    description: "أنشئ عروضك وتابع مراحلها بوضوح.",
  },
  {
    icon: BriefcaseBusiness,
    title: "العقود",
    description: "نظّم العقود وابقَ على اطلاع بتفاصيلها.",
  },
  {
    icon: FolderKanban,
    title: "المشاريع",
    description: "تابع مشاريعك وتقدّم العمل في مساحة واحدة.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="مسار - الصفحة الرئيسية">
            <Image
              src="/masar.svg"
              alt="مسار Massar"
              width={134}
              height={78}
              priority
            />
          </Link>
          <Button asChild variant="outline">
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-16 sm:px-6 md:py-24">
        <section className="flex flex-col items-center gap-6 text-center">
          <p className="text-sm font-semibold text-primary">مسار Massar</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            مساحة عملك لمتابعة العروض والعقود والمشاريع
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            مسار هو مساحة العمل التي تجمع متابعة العروض والعقود والمشاريع
            للعملاء والموظفين في مكان واحد واضح.
          </p>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <WhatsAppSupportButton
              label="تواصل مع الدعم عبر واتساب"
              size="lg"
            />
          </div>
        </section>

        <section
          className="flex flex-col gap-6"
          aria-labelledby="features-title"
        >
          <div className="flex flex-col gap-2 text-center">
            <h2 id="features-title" className="text-2xl font-semibold">
              كل ما تحتاجه في مسار واحد
            </h2>
            <p className="text-muted-foreground">
              العروض والعقود والمشاريع في مساحة عمل واحدة.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardHeader className="gap-3">
                  <Icon className="text-primary" aria-hidden="true" />
                  <CardTitle role="heading" aria-level={3}>
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <WhatsAppSupportSection />
      </div>
    </main>
  );
}
