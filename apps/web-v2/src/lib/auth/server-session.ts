import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { AuthSession } from "@/lib/auth/auth-types";
import { resolveSessionHome } from "@/lib/auth/auth-utils";

type Envelope<T> = {
  success: boolean;
  data: T;
  error: unknown;
};

function getApiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured for web-v2.");
  }

  return `${baseUrl}${path}`;
}

async function readSessionFromApi(): Promise<AuthSession | null> {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie");

  if (!cookie) {
    return null;
  }

  const response = await fetch(getApiUrl("/auth/me"), {
    headers: {
      cookie,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to resolve auth session: ${response.status}`);
  }

  const envelope = (await response.json()) as Envelope<AuthSession>;

  if (!envelope.success) {
    throw new Error("Session lookup returned an unsuccessful envelope.");
  }

  return envelope.data;
}

export const getServerSession = cache(readSessionFromApi);

export async function requireServerSession(): Promise<AuthSession> {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function redirectAuthenticatedUser(): Promise<void> {
  const session = await getServerSession();

  if (session) {
    redirect(resolveSessionHome(session));
  }
}
