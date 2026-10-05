import * as React from "react";

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string | boolean;
  showCount?: boolean;
  isFullWidth?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      helperText,
      error,
      showCount = false,
      maxLength,
      isFullWidth = true,
      disabled = false,
      className = "",
      id,
      value,
      defaultValue,
      onChange,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const [innerValue, setInnerValue] = React.useState(defaultValue || "");
    const isControlled = value !== undefined;
    const resolvedValue = isControlled ? value : innerValue;

    const generatedId = React.useId();
    const textareaId = id || generatedId;

    const hasError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : undefined;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!isControlled) {
        setInnerValue(e.target.value);
      }
      onChange?.(e);
    };

    const currentCount = String(resolvedValue || "").length;

    return (
      <div className={`${isFullWidth ? "w-full" : "w-auto inline-block"} ${className}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            rows={rows}
            maxLength={maxLength}
            value={resolvedValue}
            disabled={disabled}
            onChange={handleChange}
            aria-invalid={hasError || undefined}
            className={`w-full rounded-xl p-3.5 text-sm bg-white dark:bg-gray-900 border transition-all duration-150 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none ${
              hasError
                ? "border-status-error focus:ring-2 focus:ring-status-error/30"
                : "border-gray-300 dark:border-gray-700 focus:border-gray-900 dark:focus:border-white focus:ring-2 focus:ring-gray-900/10 shadow-2xs"
            } ${disabled ? "opacity-50 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed" : ""}`}
            {...props}
          />
        </div>

        <div className="flex items-center justify-between mt-1 text-xs">
          <div>
            {errorMessage ? (
              <span className="text-status-error font-medium">{errorMessage}</span>
            ) : helperText ? (
              <span className="text-gray-500 dark:text-gray-400">{helperText}</span>
            ) : null}
          </div>

          {showCount && (
            <span
              className={`shrink-0 tabular-nums ${
                maxLength && currentCount >= maxLength
                  ? "text-status-error font-medium"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {currentCount}
              {maxLength ? `/${maxLength}` : ""}
            </span>
          )}
        </div>
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
export default TextArea;
