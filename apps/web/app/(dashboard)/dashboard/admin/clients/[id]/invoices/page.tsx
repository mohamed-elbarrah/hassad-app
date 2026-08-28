import { redirect } from "next/navigation";

export default async function AdminClientInvoicesRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/admin/clients/${id}`);
}
