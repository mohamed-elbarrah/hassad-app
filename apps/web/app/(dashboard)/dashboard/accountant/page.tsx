"use client";

import Link from "next/link";


export default function AccountantWorkspacePage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">لوحة المالية</h1>
        <p className="text-sm text-neutral-300 mt-1">
          متابعة الفواتير والتذاكر المالية والعقود.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/accountant/invoices">
          <div className="overflow-hidden rounded-[30px] border-[1.5px] border-portal-card-border bg-natural-0 hover:shadow-md transition-shadow cursor-pointer">
            <div className="px-5 py-4">
              <h2 className="text-base font-medium text-natural-100">الفواتير</h2>
            </div>
            <div className="px-5 pb-4 text-sm text-neutral-300">
              مستحقة، مدفوعة، ومتأخرة.
            </div>
          </div>
        </Link>
        <Link href="/dashboard/accountant/tickets">
          <div className="overflow-hidden rounded-[30px] border-[1.5px] border-portal-card-border bg-natural-0 hover:shadow-md transition-shadow cursor-pointer">
            <div className="px-5 py-4">
              <h2 className="text-base font-medium text-natural-100">التذاكر المالية</h2>
            </div>
            <div className="px-5 pb-4 text-sm text-neutral-300">
              طلبات مالية داخلية.
            </div>
          </div>
        </Link>
        <Link href="/dashboard/accountant/contracts">
          <div className="overflow-hidden rounded-[30px] border-[1.5px] border-portal-card-border bg-natural-0 hover:shadow-md transition-shadow cursor-pointer">
            <div className="px-5 py-4">
              <h2 className="text-base font-medium text-natural-100">العقود (مالية)</h2>
            </div>
            <div className="px-5 pb-4 text-sm text-neutral-300">
              قيم العقود والرصيد المتبقي.
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
