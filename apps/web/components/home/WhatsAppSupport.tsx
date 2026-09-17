"use client";

import type { ComponentProps } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetPublicConfigQuery } from "@/features/settings/integrationsApi";
import { getSafeWhatsAppUrl } from "@/lib/contact";

type ButtonProps = Pick<ComponentProps<typeof Button>, "size" | "variant">;

interface WhatsAppButtonProps extends ButtonProps {
  label: string;
}

export function WhatsAppSupportButton({
  label,
  size = "default",
  variant = "outline",
}: WhatsAppButtonProps) {
  const { data } = useGetPublicConfigQuery();
  const whatsappUrl = getSafeWhatsAppUrl(data?.whatsappUrl);

  if (!whatsappUrl) return null;

  return (
    <Button asChild size={size} variant={variant}>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
        <MessageCircle data-icon="inline-start" aria-hidden="true" />
        {label}
      </a>
    </Button>
  );
}

export function WhatsAppSupportSection() {
  const { data } = useGetPublicConfigQuery();
  const whatsappUrl = getSafeWhatsAppUrl(data?.whatsappUrl);

  if (!whatsappUrl) return null;

  return (
    <section
      className="flex flex-col items-center gap-4 text-center"
      aria-labelledby="support-title"
    >
      <h2 id="support-title" className="text-xl font-semibold">
        هل تحتاج إلى حساب؟
      </h2>
      <p className="max-w-xl text-muted-foreground">
        تواصل مع فريق الدعم عبر واتساب لمساعدتك في الوصول إلى مسار.
      </p>
      <Button asChild variant="outline">
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <MessageCircle data-icon="inline-start" aria-hidden="true" />
          تواصل مع الدعم
        </a>
      </Button>
    </section>
  );
}
