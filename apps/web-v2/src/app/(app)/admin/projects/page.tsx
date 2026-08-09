import type { Metadata } from "next";

import { ProjectsWorkspace } from "@/features/projects/components/projects-workspace";

export const metadata: Metadata = {
  title: "Projects | Hassad",
};

export default function ProjectsPage() {
  return <ProjectsWorkspace />;
}
