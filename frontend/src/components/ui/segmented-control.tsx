import * as React from "react";

export interface SegmentedControlOption {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: "small" | "medium" | "large";
  isFullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

const sizeConfig = {
  small: {
    container: "p-0.5 rounded-lg text-xs",
    button: "px-2.5 py-1 text-xs gap-1.5",
    icon: "w-3.5 h-3.5",
    badge: "text-[10px] px-1 py-0.2",
  },
  medium: {
    container: "p-1 rounded-xl text-sm",
    button: "px-3.5 py-1.5 text-xs font-semibold gap-2",
    icon: "w-4 h-4",
    badge: "text-xs px-1.5 py-0.5",
  },
  large: {
    container: "p-1.5 rounded-xl text-base",
    button: "px-4 py-2 text-sm font-semibold gap-2",
    icon: "w-4.5 h-4.5",
    badge: "text-xs px-2 py-0.5",
  },
};

export function SegmentedControl({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  size = "medium",
  isFullWidth = false,
  disabled = false,
  className = "",
}: SegmentedControlProps) {
  const isControlled = controlledValue !== undefined;
  const initialValue = defaultValue !== undefined ? defaultValue : options[0]?.value;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(initialValue);
  const resolvedValue = isControlled ? controlledValue : uncontrolledValue;

  const currentSize = sizeConfig[size] || sizeConfig.medium;

  const handleSelect = (val: string, itemDisabled?: boolean) => {
    if (disabled || itemDisabled) return;
    if (!isControlled) {
      setUncontrolledValue(val);
    }
    onChange?.(val);
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={`inline-flex items-center bg-gray-100 dark:bg-gray-800 border border-gray-200/75 dark:border-gray-700/60 select-none ${
        currentSize.container
      } ${isFullWidth ? "w-full flex" : "w-auto"} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {options.map((opt) => {
        const isSelected = resolvedValue === opt.value;
        const isItemDisabled = disabled || opt.disabled;

        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={isItemDisabled}
            onClick={() => handleSelect(opt.value, opt.disabled)}
            className={`inline-flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer font-medium ${
              currentSize.button
            } ${isFullWidth ? "flex-1" : ""} ${
              isItemDisabled ? "cursor-not-allowed opacity-50" : ""
            } ${
              isSelected
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-2xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {opt.icon && (
              <span className={`shrink-0 ${currentSize.icon}`}>{opt.icon}</span>
            )}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={`ml-1 rounded-full font-bold leading-none ${currentSize.badge} ${
                  isSelected
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
