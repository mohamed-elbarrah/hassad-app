const WHATSAPP_HOSTS = new Set([
  "wa.me",
  "whatsapp.com",
  "www.whatsapp.com",
  "api.whatsapp.com",
]);

export function getWhatsAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL;

  if (!configuredUrl) return undefined;

  try {
    const url = new URL(configuredUrl);
    return url.protocol === "https:" && WHATSAPP_HOSTS.has(url.hostname)
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
