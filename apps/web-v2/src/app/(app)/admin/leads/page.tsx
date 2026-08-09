import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Orders | Hassad",
};

export default function LeadsPage() {
  redirect("/admin/crm/orders");
}
