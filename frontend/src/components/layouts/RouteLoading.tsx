import { Skeleton } from "@/components/ui/skeleton";

/**
 * Instant navigation fallback rendered by route-group `loading.tsx` files.
 * Next.js prefetches it, so the shell swaps to this skeleton immediately while
 * the next page's server payload streams in.
 */
export function RouteLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Đang tải trang"
      className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6"
    >
      <Skeleton variant="text" width="40%" height={28} />
      <Skeleton variant="text" width="65%" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} height={160} />
        ))}
      </div>
    </div>
  );
}

export default RouteLoading;
