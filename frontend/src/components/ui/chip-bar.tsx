import * as React from "react";

export interface ChipItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}

export interface ChipBarProps {
  chips: ChipItem[];
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onChange?: (selectedIds: string[]) => void;
  mode?: "single" | "multiple";
  className?: string;
}

export function ChipBar({
  chips,
  selectedIds: controlledSelectedIds,
  defaultSelectedIds = [],
  onChange,
  mode = "single",
  className = "",
}: ChipBarProps) {
  const isControlled = controlledSelectedIds !== undefined;
  const [uncontrolledIds, setUncontrolledIds] = React.useState<string[]>(defaultSelectedIds);
  const activeIds = isControlled ? controlledSelectedIds : uncontrolledIds;

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleChipClick = (id: string) => {
    let next: string[];
    if (mode === "single") {
      next = activeIds.includes(id) ? [] : [id];
    } else {
      next = activeIds.includes(id)
        ? activeIds.filter((item) => item !== id)
        : [...activeIds, id];
    }
    if (!isControlled) {
      setUncontrolledIds(next);
    }
    onChange?.(next);
  };

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const distance = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -distance : distance,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={`relative flex items-center w-full group ${className}`}>
      {/* Scroll Left Button */}
      <button
        type="button"
        onClick={() => handleScroll("left")}
        aria-label="Cuộn sang trái"
        className="hidden group-hover:flex items-center justify-center absolute left-0 z-10 w-7 h-7 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Chip List Scroll Area */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth w-full"
      >
        {chips.map((chip) => {
          const isSelected = activeIds.includes(chip.id);

          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleChipClick(chip.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 select-none cursor-pointer border ${
                isSelected
                  ? "bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900 shadow-2xs"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {chip.icon && <span className="w-3.5 h-3.5 shrink-0">{chip.icon}</span>}
              <span>{chip.label}</span>
              {chip.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? "bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {chip.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        type="button"
        onClick={() => handleScroll("right")}
        aria-label="Cuộn sang phải"
        className="hidden group-hover:flex items-center justify-center absolute right-0 z-10 w-7 h-7 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

export default ChipBar;
