const WHATSAPP_HOSTS = new Set([
  "wa.me",
  "whatsapp.com",
  "www.whatsapp.com",
  "api.whatsapp.com",
]);

export function getSafeWhatsAppUrl(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && WHATSAPP_HOSTS.has(url.hostname)
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
