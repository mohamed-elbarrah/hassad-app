"use client";
import { use } from "react";
import ClientProfilePage from "../../../sales/clients/[id]/page";

export default function AdminClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ClientProfilePage params={Promise.resolve({ id })} />;
}
