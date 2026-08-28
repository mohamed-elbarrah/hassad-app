import { redirect } from "next/navigation";

export default async function AdminClientProjectsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/admin/clients/${id}`);
}
