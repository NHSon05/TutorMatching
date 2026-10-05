import * as React from "react";

export type TimelineItemStatus = "completed" | "current" | "pending" | "error";

export interface TimelineItem {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  time?: string;
  status?: TimelineItemStatus;
  icon?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const statusConfig: Record<
  TimelineItemStatus,
  {
    dot: string;
    line: string;
    title: string;
  }
> = {
  completed: {
    dot: "bg-emerald-600 text-white ring-4 ring-emerald-50 dark:ring-emerald-950/40",
    line: "bg-emerald-500",
    title: "text-gray-900 dark:text-gray-100 font-semibold",
  },
  current: {
    dot: "bg-brand text-white ring-4 ring-blue-50 dark:ring-blue-950/40 animate-pulse",
    line: "bg-gray-200 dark:bg-gray-800",
    title: "text-brand font-bold",
  },
  pending: {
    dot: "bg-gray-200 dark:bg-gray-700 text-gray-500 ring-4 ring-gray-50 dark:ring-gray-900",
    line: "bg-gray-200 dark:bg-gray-800",
    title: "text-gray-500 dark:text-gray-400 font-medium",
  },
  error: {
    dot: "bg-status-error text-white ring-4 ring-red-50 dark:ring-red-950/40",
    line: "bg-gray-200 dark:bg-gray-800",
    title: "text-status-error font-semibold",
  },
};

export function Timeline({ items, className = "" }: TimelineProps) {
  return (
    <div className={`relative space-y-6 ${className}`}>
      {items.map((item, index) => {
        const status = item.status || "pending";
        const cfg = statusConfig[status] || statusConfig.pending;
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="relative flex items-start gap-4 group">
            {/* Connecting Vertical Line */}
            {!isLast && (
              <span
                className={`absolute top-6 left-3.5 -ml-px w-0.5 h-[calc(100%+12px)] ${cfg.line}`}
                aria-hidden="true"
              />
            )}

            {/* Node Indicator */}
            <div
              className={`relative flex items-center justify-center w-7 h-7 rounded-full shrink-0 z-10 text-xs font-bold transition-all ${cfg.dot}`}
            >
              {item.icon ? (
                item.icon
              ) : status === "completed" ? (
                <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : status === "error" ? (
                <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                index + 1
              )}
            </div>

            {/* Content Details */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                <h4 className={`text-sm ${cfg.title}`}>{item.title}</h4>
                {item.time && (
                  <time className="text-[11px] text-gray-400 dark:text-gray-500 font-normal">
                    {item.time}
                  </time>
                )}
              </div>

              {item.description && (
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Timeline;
