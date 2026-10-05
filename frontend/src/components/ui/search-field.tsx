import * as React from "react";

export interface SearchFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onSubmit"> {
  onSearch?: (query: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
  shortcut?: string;
  size?: "small" | "medium" | "large";
  isFullWidth?: boolean;
}

const sizeStyles = {
  small: {
    container: "h-9 text-xs",
    icon: "w-3.5 h-3.5",
    kbd: "text-[10px] px-1 py-0.5",
  },
  medium: {
    container: "h-11 text-sm",
    icon: "w-4 h-4",
    kbd: "text-xs px-1.5 py-0.5",
  },
  large: {
    container: "h-12 text-base",
    icon: "w-5 h-5",
    kbd: "text-xs px-2 py-1",
  },
};

export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    {
      onSearch,
      onClear,
      isLoading = false,
      shortcut = "⌘K",
      size = "medium",
      isFullWidth = true,
      disabled = false,
      placeholder = "Tìm kiếm gia sư, môn học...",
      className = "",
      value,
      defaultValue,
      onChange,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const [innerValue, setInnerValue] = React.useState(defaultValue || "");
    const isControlled = value !== undefined;
    const resolvedValue = isControlled ? value : innerValue;

    const currentSize = sizeStyles[size] || sizeStyles.medium;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInnerValue(e.target.value);
      }
      onChange?.(e);
    };

    const handleClear = () => {
      if (!isControlled) {
        setInnerValue("");
      }
      onClear?.();
      onSearch?.("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSearch?.(String(resolvedValue));
      }
      onKeyDown?.(e);
    };

    const hasValue = Boolean(resolvedValue);

    return (
      <div
        className={`relative flex items-center rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 transition-all duration-150 focus-within:border-gray-900 dark:focus-within:border-white focus-within:ring-2 focus-within:ring-gray-900/10 shadow-2xs ${
          currentSize.container
        } ${isFullWidth ? "w-full" : "w-72"} ${
          disabled ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50" : ""
        } ${className}`}
      >
        <span className="pl-3.5 flex items-center justify-center text-gray-400 dark:text-gray-500 shrink-0 pointer-events-none">
          {isLoading ? (
            <svg
              className={`${currentSize.icon} animate-spin text-brand`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" opacity="0.25" />
              <path d="M22 12C22 6.47715 17.5228 2 12 2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              className={currentSize.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </span>

        <input
          ref={ref}
          type="search"
          value={resolvedValue}
          disabled={disabled}
          placeholder={placeholder}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent pl-2.5 pr-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          {...props}
        />

        {hasValue && !disabled && (
          <button
            type="button"
            aria-label="Xóa nội dung tìm kiếm"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0 mr-1.5"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {shortcut && !hasValue && !isLoading && (
          <kbd
            className={`hidden sm:inline-flex items-center font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded mr-3 shrink-0 select-none ${currentSize.kbd}`}
          >
            {shortcut}
          </kbd>
        )}
      </div>
    );
  }
);

SearchField.displayName = "SearchField";
export default SearchField;
