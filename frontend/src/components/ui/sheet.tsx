import * as React from "react";

export type SheetSide = "right" | "left" | "bottom" | "top";

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  side?: SheetSide;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const sideStyles: Record<SheetSide, { panel: string; animation: string }> = {
  right: {
    panel: "inset-y-0 right-0 h-full w-full max-w-md border-l",
    animation: "slide-in-from-right",
  },
  left: {
    panel: "inset-y-0 left-0 h-full w-full max-w-md border-r",
    animation: "slide-in-from-left",
  },
  bottom: {
    panel: "inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-3xl border-t",
    animation: "slide-in-from-bottom",
  },
  top: {
    panel: "inset-x-0 top-0 w-full max-h-[85vh] rounded-b-3xl border-b",
    animation: "slide-in-from-top",
  },
};

export function Sheet({
  isOpen,
  onClose,
  side = "right",
  title,
  description,
  children,
  footer,
  className = "",
}: SheetProps) {
  // Lock body scroll
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape key
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentSide = sideStyles[side] || sideStyles.right;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Slide-over Panel */}
      <div
        className={`fixed bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-in-out animate-in ${
          currentSide.panel
        } ${currentSide.animation} ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            {title && (
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng ngăn kéo"
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-sm text-gray-700 dark:text-gray-300">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Sheet;
