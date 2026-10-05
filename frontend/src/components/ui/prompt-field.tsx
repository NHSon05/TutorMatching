import * as React from "react";

export interface PromptFieldProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  onAttach?: () => void;
  showAttachButton?: boolean;
  className?: string;
  minRows?: number;
  maxRows?: number;
}

export const PromptField = React.forwardRef<HTMLTextAreaElement, PromptFieldProps>(
  (
    {
      value: controlledValue,
      defaultValue = "",
      onChange,
      onSubmit,
      placeholder = "Mô tả yêu cầu tìm gia sư bằng ngôn ngữ tự nhiên...",
      isLoading = false,
      disabled = false,
      onAttach,
      showAttachButton = false,
      className = "",
      minRows = 2,
    },
    ref
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const resolvedValue = isControlled ? controlledValue : uncontrolledValue;

    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextVal = e.target.value;
      if (!isControlled) {
        setUncontrolledValue(nextVal);
      }
      onChange?.(nextVal);
    };

    const handleSend = () => {
      const trimmed = resolvedValue.trim();
      if (!trimmed || isLoading || disabled) return;
      onSubmit?.(trimmed);
      if (!isControlled) {
        setUncontrolledValue("");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const canSubmit = Boolean(resolvedValue.trim()) && !isLoading && !disabled;

    return (
      <div
        className={`relative flex flex-col w-full rounded-2xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 transition-all duration-150 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 shadow-sm ${
          disabled ? "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50" : ""
        } ${className}`}
      >
        <textarea
          ref={textareaRef}
          rows={minRows}
          value={resolvedValue}
          disabled={disabled}
          placeholder={placeholder}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full resize-none bg-transparent px-2 pt-1 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
        />

        <div className="flex items-center justify-between pt-2 px-1">
          <div>
            {showAttachButton && (
              <button
                type="button"
                aria-label="Đính kèm tệp"
                disabled={disabled || isLoading}
                onClick={onAttach}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Gửi yêu cầu"
              disabled={!canSubmit}
              onClick={handleSend}
              className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150 ${
                canSubmit
                  ? "bg-brand text-white hover:bg-brand-hover shadow-xs cursor-pointer active:scale-95"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" opacity="0.25" />
                  <path d="M22 12C22 6.47715 17.5228 2 12 2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

PromptField.displayName = "PromptField";
export default PromptField;
