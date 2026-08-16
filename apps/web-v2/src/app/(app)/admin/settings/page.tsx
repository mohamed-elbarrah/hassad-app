import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageScaffold } from "@/components/patterns/page-scaffold";

export const metadata: Metadata = { title: "Settings | Hassad" };

const sections = [
  { href: "/admin/settings/payments", title: "Payment gateways", description: "Configure client payment methods and gateway credentials." },
  { href: "/admin/settings/currencies", title: "Currencies", description: "Manage active currencies, symbols, and the default currency." },
  { href: "/admin/settings/ai", title: "AI providers", description: "Manage encrypted provider keys, models, and fallback priority." },
];

export default function SettingsPage() {
  return <PageScaffold title="System settings" description="Manage organization-wide payment, currency, and AI configuration."><div className="grid gap-4 md:grid-cols-3">{sections.map((section) => <Card key={section.href}><CardHeader><CardTitle>{section.title}</CardTitle><CardDescription>{section.description}</CardDescription></CardHeader><CardContent><Link className={buttonVariants()} href={section.href}>Open settings</Link></CardContent></Card>)}</div></PageScaffold>;
}
