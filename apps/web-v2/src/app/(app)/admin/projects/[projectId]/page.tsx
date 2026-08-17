import type { Metadata } from "next";
import { ProjectDetailPageClient } from "./page-client";

type ProjectDetailPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Project Detail | Hassad",
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { projectId } = await params;
  return <ProjectDetailPageClient projectId={projectId} />;
}
