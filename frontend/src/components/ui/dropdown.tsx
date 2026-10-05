import * as React from "react";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string | boolean;
  isSearchable?: boolean;
  searchPlaceholder?: string;
  isFullWidth?: boolean;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
  id?: string;
}

const sizeStyles = {
  small: {
    trigger: "h-9 text-xs px-3",
    menuItem: "text-xs py-1.5 px-3",
    icon: "w-3.5 h-3.5",
  },
  medium: {
    trigger: "h-11 text-sm px-3.5",
    menuItem: "text-sm py-2 px-3.5",
    icon: "w-4 h-4",
  },
  large: {
    trigger: "h-12 text-base px-4",
    menuItem: "text-base py-2.5 px-4",
    icon: "w-4.5 h-4.5",
  },
};

export function Dropdown({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = "Chọn một tùy chọn...",
  label,
  helperText,
  error,
  isSearchable = false,
  searchPlaceholder = "Tìm kiếm...",
  isFullWidth = true,
  disabled = false,
  size = "medium",
  className = "",
  id,
}: DropdownProps) {
  const isControlled = controlledValue !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || "");
  const selectedValue = isControlled ? controlledValue : uncontrolledValue;

  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const generatedId = React.useId();
  const dropdownId = id || generatedId;

  const currentSize = sizeStyles[size] || sizeStyles.medium;
  const selectedOption = options.find((opt) => opt.value === selectedValue);

  // Click outside listener
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, isSearchable]);

  const handleSelect = (val: string, itemDisabled?: boolean) => {
    if (itemDisabled) return;
    if (!isControlled) {
      setUncontrolledValue(val);
    }
    onChange?.(val);
    setIsOpen(false);
    setSearchQuery("");
  };

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const lower = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lower) ||
        (opt.description && opt.description.toLowerCase().includes(lower))
    );
  }, [options, searchQuery]);

  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;

  return (
    <div
      ref={containerRef}
      className={`relative ${isFullWidth ? "w-full" : "w-64 inline-block"} ${className}`}
    >
      {label && (
        <label
          htmlFor={dropdownId}
          className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={dropdownId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center justify-between w-full rounded-xl bg-white dark:bg-gray-900 border transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 ${
          currentSize.trigger
        } ${
          hasError
            ? "border-status-error focus:ring-status-error/30"
            : isOpen
            ? "border-gray-900 dark:border-white focus:ring-gray-900/10"
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 focus:ring-gray-900/10 shadow-2xs"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50" : ""}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className={`shrink-0 ${currentSize.icon}`}>{selectedOption.icon}</span>
          )}
          <span
            className={`truncate ${
              selectedOption
                ? "text-gray-900 dark:text-gray-100 font-medium"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

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

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {isSearchable && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-gray-400"
              />
            </div>
          )}

          <ul
            role="listbox"
            tabIndex={-1}
            className="max-h-60 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/50 py-1"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3.5 py-3 text-xs text-center text-gray-400 dark:text-gray-500">
                Không tìm thấy tùy chọn phù hợp
              </li>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValue === opt.value;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value, opt.disabled)}
                    className={`flex items-center justify-between cursor-pointer transition-colors duration-100 ${
                      currentSize.menuItem
                    } ${
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : isSelected
                        ? "bg-brand/10 text-brand font-semibold"
                        : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className={currentSize.icon}>{opt.icon}</span>}
                      <div className="truncate">
                        <div>{opt.label}</div>
                        {opt.description && (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-normal truncate">
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-brand shrink-0 ml-2"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
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

export default Dropdown;
