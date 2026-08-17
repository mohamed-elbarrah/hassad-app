import type { Metadata } from "next";

import { PmProjectDetailPageClient } from "./page-client";

type PmProjectDetailPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export const metadata: Metadata = {
  title: "PM Project detail | Hassad",
};

export default async function PmProjectDetailPage({ params }: PmProjectDetailPageProps) {
  const { projectId } = await params;
  return <PmProjectDetailPageClient projectId={projectId} />;
}
