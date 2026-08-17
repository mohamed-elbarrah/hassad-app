"use client";

import type { ServiceItem } from "@hassad/shared";

interface ContractServicesTableProps {
  services: ServiceItem[];
  totalValue: number;
}

export function ContractServicesTable({
  services,
  totalValue,
}: ContractServicesTableProps) {
  if (!services || services.length === 0) return null;

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <p className="text-sm font-semibold">الخدمات المشمولة</p>
      {services.map((service, idx) => (
        <div key={idx} className="flex items-center justify-between text-sm">
          <span className="text-foreground">{service.name}</span>
          <span className="text-muted-foreground font-medium">
            {service.price.toLocaleString("en-US")} ر.س
          </span>
        </div>
      ))}
      <div className="border-t pt-2 flex items-center justify-between text-sm font-bold">
        <span>الإجمالي</span>
        <span>{totalValue.toLocaleString("en-US")} ر.س</span>
      </div>
    </div>
  );
}
