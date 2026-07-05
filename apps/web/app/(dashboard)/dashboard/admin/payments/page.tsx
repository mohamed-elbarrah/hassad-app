import { redirect } from "next/navigation";

export default function OldPaymentsRedirect() {
  redirect("/dashboard/admin/finance/payments");
}
