import * as React from "react";

export type TextFieldSize = "small" | "medium" | "large";
export type TextFieldVariant = "outlined" | "filled";

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string | boolean;
  size?: TextFieldSize;
  variant?: TextFieldVariant;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  isClearable?: boolean;
  onClear?: () => void;
  isFullWidth?: boolean;
}

const sizeConfig: Record<
  TextFieldSize,
  {
    input: string;
    container: string;
    icon: string;
    label: string;
    helper: string;
  }
> = {
  small: {
    input: "h-9 text-xs px-3",
    container: "h-9 text-xs",
    icon: "w-3.5 h-3.5",
    label: "text-xs mb-1",
    helper: "text-[11px] mt-1",
  },
  medium: {
    input: "h-11 text-sm px-3.5",
    container: "h-11 text-sm",
    icon: "w-4 h-4",
    label: "text-xs font-semibold mb-1.5",
    helper: "text-xs mt-1.5",
  },
  large: {
    input: "h-12 text-base px-4",
    container: "h-12 text-base",
    icon: "w-5 h-5",
    label: "text-sm font-semibold mb-1.5",
    helper: "text-xs mt-1.5",
  },
};

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      helperText,
      error,
      size = "medium",
      variant = "outlined",
      leadingIcon,
      trailingIcon,
      prefix,
      suffix,
      isClearable = false,
      onClear,
      isFullWidth = true,
      disabled = false,
      className = "",
      id,
      value,
      defaultValue,
      onChange,
      type = "text",
      ...props
    },
    ref
  ) => {
    const [innerValue, setInnerValue] = React.useState(defaultValue || "");
    const isControlled = value !== undefined;
    const resolvedValue = isControlled ? value : innerValue;

    const generatedId = React.useId();
    const inputId = id || generatedId;
    const currentSize = sizeConfig[size] || sizeConfig.medium;

    const hasError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : undefined;

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
    };

    const canClear = isClearable && !disabled && Boolean(resolvedValue);

    return (
      <div className={`${isFullWidth ? "w-full" : "w-auto inline-block"} ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-gray-700 dark:text-gray-300 ${currentSize.label}`}
          >
            {label}
          </label>
        )}

        <div
          className={`relative flex items-center w-full rounded-xl transition-all duration-150 border ${
            currentSize.container
          } ${
            hasError
              ? "border-status-error focus-within:ring-2 focus-within:ring-status-error/30"
              : variant === "filled"
              ? "bg-gray-100 dark:bg-gray-800 border-transparent focus-within:bg-white dark:focus-within:bg-gray-900 focus-within:border-gray-900 dark:focus-within:border-white focus-within:ring-2 focus-within:ring-gray-900/10"
              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus-within:border-gray-900 dark:focus-within:border-white focus-within:ring-2 focus-within:ring-gray-900/10 shadow-2xs"
          } ${disabled ? "opacity-50 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed" : ""}`}
        >
          {leadingIcon && (
            <span className="pl-3.5 flex items-center justify-center text-gray-400 dark:text-gray-500 shrink-0 pointer-events-none">
              <span className={currentSize.icon}>{leadingIcon}</span>
            </span>
          )}

          {prefix && (
            <span className="pl-3 text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0 select-none">
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            value={resolvedValue}
            disabled={disabled}
            onChange={handleChange}
            aria-invalid={hasError || undefined}
            className={`w-full h-full bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none ${
              leadingIcon ? "pl-2" : prefix ? "pl-1.5" : "pl-3.5"
            } ${trailingIcon || canClear || suffix ? "pr-2" : "pr-3.5"}`}
            {...props}
          />

          {canClear && (
            <button
              type="button"
              aria-label="Xóa nội dung"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0 mr-1"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          {suffix && (
            <span className="pr-3 text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0 select-none">
              {suffix}
            </span>
          )}

          {trailingIcon && (
            <span className="pr-3.5 flex items-center justify-center text-gray-400 dark:text-gray-500 shrink-0 pointer-events-none">
              <span className={currentSize.icon}>{trailingIcon}</span>
            </span>
          )}
        </div>

        {errorMessage && (
          <p className={`text-status-error font-medium ${currentSize.helper}`}>{errorMessage}</p>
        )}
        {helperText && !errorMessage && (
          <p className={`text-gray-500 dark:text-gray-400 ${currentSize.helper}`}>{helperText}</p>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";
export default TextField;
