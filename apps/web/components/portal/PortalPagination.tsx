import { cn } from "@/lib/utils";

interface PortalPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PortalPagination({
  page,
  totalPages,
  onPageChange,
}: PortalPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 border-t-[1.5px] border-portal-divider pt-5">
      <button
        type="button"
        className="inline-flex h-12 items-center justify-center rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-5 text-base font-medium text-portal-icon transition-colors hover:bg-badge-gray-bg disabled:opacity-50"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        السابق
      </button>

      <div className="inline-flex items-center justify-center rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg px-5 py-3 text-sm font-medium text-secondary-500">
        {page} من {totalPages}
      </div>

      <button
        type="button"
        className="inline-flex h-12 items-center justify-center rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-5 text-base font-medium text-portal-icon transition-colors hover:bg-badge-gray-bg disabled:opacity-50"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        التالي
      </button>
    </div>
  );
}
