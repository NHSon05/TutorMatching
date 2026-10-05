import * as React from "react";

export interface SelectCheckOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectCheckProps {
  options: SelectCheckOption[];
  values?: string[];
  defaultValues?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string | boolean;
  maxDisplayedBadges?: number;
  isSearchable?: boolean;
  isFullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function SelectCheck({
  options,
  values: controlledValues,
  defaultValues = [],
  onChange,
  placeholder = "Chọn các mục...",
  label,
  helperText,
  error,
  maxDisplayedBadges = 2,
  isSearchable = true,
  isFullWidth = true,
  disabled = false,
  className = "",
  id,
}: SelectCheckProps) {
  const isControlled = controlledValues !== undefined;
  const [uncontrolledValues, setUncontrolledValues] = React.useState<string[]>(defaultValues);
  const selectedValues = isControlled ? controlledValues : uncontrolledValues;

  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const containerRef = React.useRef<HTMLDivElement>(null);
  const generatedId = React.useId();
  const selectId = id || generatedId;

  // Click outside listener
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (val: string, itemDisabled?: boolean) => {
    if (itemDisabled || disabled) return;
    const exists = selectedValues.includes(val);
    const nextValues = exists
      ? selectedValues.filter((v) => v !== val)
      : [...selectedValues, val];

    if (!isControlled) {
      setUncontrolledValues(nextValues);
    }
    onChange?.(nextValues);
  };

  const handleSelectAll = () => {
    const allEnabled = options.filter((o) => !o.disabled).map((o) => o.value);
    const next = selectedValues.length === allEnabled.length ? [] : allEnabled;
    if (!isControlled) {
      setUncontrolledValues(next);
    }
    onChange?.(next);
  };

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const lower = searchQuery.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lower));
  }, [options, searchQuery]);

  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;

  const selectedLabels = options
    .filter((o) => selectedValues.includes(o.value))
    .map((o) => o.label);

  return (
    <div
      ref={containerRef}
      className={`relative ${isFullWidth ? "w-full" : "w-72 inline-block"} ${className}`}
    >
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center justify-between min-h-11 w-full rounded-xl bg-white dark:bg-gray-900 border px-3.5 py-1.5 transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 ${
          hasError
            ? "border-status-error focus:ring-status-error/30"
            : isOpen
            ? "border-gray-900 dark:border-white focus:ring-gray-900/10"
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 focus:ring-gray-900/10 shadow-2xs"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50" : ""}`}
      >
        <div className="flex flex-wrap items-center gap-1.5 truncate">
          {selectedValues.length === 0 ? (
            <span className="text-sm text-gray-400 dark:text-gray-500">{placeholder}</span>
          ) : (
            <>
              {selectedLabels.slice(0, maxDisplayedBadges).map((lbl) => (
                <span
                  key={lbl}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                >
                  {lbl}
                </span>
              ))}
              {selectedValues.length > maxDisplayedBadges && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-semibold bg-brand/10 text-brand">
                  +{selectedValues.length - maxDisplayedBadges}
                </span>
              )}
            </>
          )}
        </div>

        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
            {isSearchable ? (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full px-2.5 py-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-gray-400"
              />
            ) : null}
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-brand hover:underline font-semibold whitespace-nowrap px-1"
            >
              {selectedValues.length === options.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
          </div>

          <ul className="max-h-56 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/50 py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3.5 py-3 text-xs text-center text-gray-400 dark:text-gray-500">
                Không tìm thấy kết quả
              </li>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = selectedValues.includes(opt.value);
                return (
                  <li
                    key={opt.value}
                    onClick={() => handleToggle(opt.value, opt.disabled)}
                    className={`flex items-center gap-2.5 px-3.5 py-2 text-xs select-none cursor-pointer transition-colors ${
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : isChecked
                        ? "bg-brand/5 text-gray-900 dark:text-gray-100 font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isChecked
                          ? "bg-brand border-brand text-white"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      }`}
                    >
                      {isChecked && (
                        <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-status-error font-medium mt-1">{errorMessage}</p>
      )}
      {helperText && !errorMessage && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helperText}</p>
      )}
    </div>
  );
}

export default SelectCheck;
