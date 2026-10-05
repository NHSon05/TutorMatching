import * as React from "react";

export interface AccordionItemProps {
  id: string;
  title: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItemProps[];
  allowMultiple?: boolean;
  defaultOpenIds?: string[];
  className?: string;
}

export function Accordion({
  items,
  allowMultiple = false,
  defaultOpenIds = [],
  className = "",
}: AccordionProps) {
  const [openIds, setOpenIds] = React.useState<string[]>(defaultOpenIds);

  const toggleItem = (id: string, itemDisabled?: boolean) => {
    if (itemDisabled) return;
    setOpenIds((prev) => {
      const isOpen = prev.includes(id);
      if (isOpen) {
        return prev.filter((item) => item !== id);
      }
      return allowMultiple ? [...prev, id] : [id];
    });
  };

  return (
    <div className={`divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800 ${className}`}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);

        return (
          <div key={item.id} className="py-1">
            <button
              type="button"
              disabled={item.disabled}
              onClick={() => toggleItem(item.id, item.disabled)}
              aria-expanded={isOpen}
              className={`flex items-center justify-between w-full py-3.5 text-left transition-colors select-none cursor-pointer ${
                item.disabled ? "opacity-50 cursor-not-allowed" : "hover:text-brand"
              }`}
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {item.title}
              </span>

              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ml-3 ${
                  isOpen ? "rotate-180 text-brand" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isOpen && (
              <div className="pb-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed animate-in fade-in-50 duration-150">
                {item.children}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Accordion;
