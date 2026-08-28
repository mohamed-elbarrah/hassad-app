import { redirect } from "next/navigation";

export default async function AdminClientContractsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/admin/clients/${id}`);
}
