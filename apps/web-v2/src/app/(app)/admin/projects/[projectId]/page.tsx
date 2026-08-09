import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectDetailWorkspace } from "@/features/projects/components/project-detail-workspace";
import { getProjectDetailById } from "@/features/projects/lib/project-detail";

type ProjectDetailPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { projectId } = await params;
  const project = getProjectDetailById(projectId);

  return {
    title: project ? `${project.name} | Hassad` : "Project Detail | Hassad",
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { projectId } = await params;
  const project = getProjectDetailById(projectId);

  if (!project) {
    notFound();
  }

  return <ProjectDetailWorkspace project={project} />;
}
