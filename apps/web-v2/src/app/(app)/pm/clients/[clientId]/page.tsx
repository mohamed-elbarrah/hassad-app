import type { Metadata } from "next";

import { requireServerSession } from "@/lib/auth/server-session";
import { PmClientDetailPageClient } from "./page-client";

type ClientDetailPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "PM Client Detail | Hassad",
  };
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const session = await requireServerSession();
  const { clientId } = await params;
  return <PmClientDetailPageClient clientId={clientId} currentUserId={session.id} />;
}
