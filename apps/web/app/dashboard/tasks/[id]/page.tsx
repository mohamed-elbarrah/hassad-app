import { redirect } from "next/navigation";
import { cookies } from "next/headers";

interface PageProps {
  params: { id: string };
}

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let payload = parts[1];
    payload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = payload.length % 4;
    if (pad) payload += "=".repeat(4 - pad);
    const json = Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default async function TaskRedirectPage({ params }: PageProps) {
  const { id } = params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    redirect(`/login?callbackUrl=/dashboard/tasks/${id}`);
  }

  const payload = decodeJwtPayload(token as string);
  const role = payload?.role as string | undefined;

  if (role === "EMPLOYEE") {
    redirect(`/dashboard/employee/tasks/${id}`);
  } else if (role === "PM" || role === "ADMIN") {
    redirect(`/dashboard/pm/tasks/${id}`);
  } else {
    redirect("/dashboard");
  }
}
