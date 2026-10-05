import * as React from "react";

export interface GanttTask {
  id: string;
  name: string;
  category?: string;
  startWeek: number; // 1-indexed (e.g., Week 1)
  durationWeeks: number; // e.g., 2 weeks
  progress?: number; // 0 - 100
  status?: "completed" | "in-progress" | "planned";
}

export interface GanttChartProps {
  tasks: GanttTask[];
  totalWeeks?: number;
  title?: string;
  className?: string;
}

const statusStyles = {
  completed: "bg-emerald-500 text-white",
  "in-progress": "bg-brand text-white",
  planned: "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
};

export function GanttChart({
  tasks,
  totalWeeks = 8,
  title = "Lộ trình ôn tập & Kế hoạch học tập",
  className = "",
}: GanttChartProps) {
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  return (
    <div
      className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-2xs overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-gray-500">Đã học xong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand" />
            <span className="text-gray-500">Đang học</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
            <span className="text-gray-500">Kế hoạch tới</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[650px]">
          {/* Header row: Chuyên đề & các Tuần */}
          <div className="grid grid-cols-12 border-b border-gray-200 dark:border-gray-800 pb-2 text-xs font-semibold text-gray-400">
            <div className="col-span-4 pl-2">Chuyên đề học tập</div>
            <div className="col-span-8 grid" style={{ gridTemplateColumns: `repeat(${totalWeeks}, minmax(0, 1fr))` }}>
              {weeks.map((w) => (
                <div key={w} className="text-center font-bold">
                  Tuần {w}
                </div>
              ))}
            </div>
          </div>

          {/* Task rows */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800/60 pt-2">
            {tasks.map((task) => {
              const startCol = Math.max(1, Math.min(task.startWeek, totalWeeks));
              const spanCols = Math.max(1, Math.min(task.durationWeeks, totalWeeks - startCol + 1));
              const statusClass = statusStyles[task.status || "in-progress"] || statusStyles["in-progress"];

              return (
                <div key={task.id} className="grid grid-cols-12 items-center py-2.5 text-xs">
                  {/* Task name & category */}
                  <div className="col-span-4 pr-3 pl-2 truncate">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 truncate block">
                      {task.name}
                    </span>
                    {task.category && (
                      <span className="text-[11px] text-gray-400 font-normal">
                        {task.category}
                      </span>
                    )}
                  </div>

                  {/* Timeline Bar Area */}
                  <div
                    className="col-span-8 relative h-7 grid items-center bg-gray-50/50 dark:bg-gray-800/30 rounded-lg p-0.5"
                    style={{ gridTemplateColumns: `repeat(${totalWeeks}, minmax(0, 1fr))` }}
                  >
                    <div
                      className={`h-full rounded-md flex items-center px-2 text-[10px] font-bold shadow-2xs truncate transition-all ${statusClass}`}
                      style={{
                        gridColumnStart: startCol,
                        gridColumnEnd: `span ${spanCols}`,
                      }}
                    >
                      <span className="truncate">
                        {task.progress !== undefined ? `${task.progress}%` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GanttChart;
