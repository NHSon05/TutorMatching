import * as React from "react";

export type CheckboxSize = "small" | "medium" | "large";
export type CheckboxVariant = "primary" | "brand" | "tutor";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  /**
   * Controlled checked state
   */
  checked?: boolean;
  /**
   * Default checked state for uncontrolled usage
   */
  defaultChecked?: boolean;
  /**
   * Indeterminate (partially checked) state
   * @default false
   */
  indeterminate?: boolean;
  /**
   * Callback fired when checked state changes
   */
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Main label displayed alongside the checkbox
   */
  label?: React.ReactNode;
  /**
   * Secondary helper or description text displayed below the label
   */
  helperText?: React.ReactNode;
  /**
   * Error message string or boolean flag indicating error state
   */
  error?: string | boolean;
  /**
   * Visual size:
   * - small: 16px box
   * - medium: 20px box (default)
   * - large: 24px box
   * @default 'medium'
   */
  size?: CheckboxSize;
  /**
   * Visual color variant when checked:
   * - primary: Dark solid (gray-900)
   * - brand: Blue brand color (Learner)
   * - tutor: Amber color (Tutor)
   * @default 'primary'
   */
  variant?: CheckboxVariant;
}

const sizeConfig: Record<
  CheckboxSize,
  {
    box: string;
    icon: string;
    label: string;
    helper: string;
  }
> = {
  small: {
    box: "w-4 h-4 rounded text-xs",
    icon: "w-3 h-3",
    label: "text-xs pt-0",
    helper: "text-[11px]",
  },
  medium: {
    box: "w-5 h-5 rounded-md text-sm",
    icon: "w-3.5 h-3.5",
    label: "text-sm pt-0",
    helper: "text-xs",
  },
  large: {
    box: "w-6 h-6 rounded-md text-base",
    icon: "w-4 h-4",
    label: "text-base pt-0.5",
    helper: "text-sm",
  },
};

const checkedVariantStyles: Record<CheckboxVariant, string> = {
  primary:
    "bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900 focus-visible:ring-gray-900",
  brand:
    "bg-brand border-brand text-white focus-visible:ring-brand",
  tutor:
    "bg-role-tutor border-role-tutor text-white focus-visible:ring-role-tutor",
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked: controlledChecked,
      defaultChecked = false,
      indeterminate = false,
      onChange,
      disabled = false,
      label,
      helperText,
      error,
      size = "medium",
      variant = "primary",
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const isControlled = controlledChecked !== undefined;
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked);
    const isChecked = isControlled ? controlledChecked : uncontrolledChecked;

    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const generatedId = React.useId();
    const inputId = id || generatedId;
    const currentSize = sizeConfig[size] || sizeConfig.medium;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const nextChecked = e.target.checked;
      if (!isControlled) {
        setUncontrolledChecked(nextChecked);
      }
      onChange?.(nextChecked, e);
    };

    const hasError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : undefined;

    return (
      <div className={`inline-flex flex-col ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
        <label
          htmlFor={inputId}
          className={`inline-flex items-start gap-2.5 select-none ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <div className="relative flex items-center justify-center shrink-0">
            <input
              ref={inputRef}
              id={inputId}
              type="checkbox"
              checked={isChecked}
              disabled={disabled}
              onChange={handleChange}
              aria-invalid={hasError || undefined}
              className="peer sr-only"
              {...props}
            />
            <div
              className={`flex items-center justify-center shrink-0 border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                currentSize.box
              } ${
                hasError
                  ? "border-status-error focus-visible:ring-status-error"
                  : isChecked || indeterminate
                  ? checkedVariantStyles[variant]
                  : "border-gray-300 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 focus-visible:ring-gray-400 shadow-2xs"
              }`}
            >
              {indeterminate ? (
                <svg
                  className={`${currentSize.icon} stroke-current`}
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              ) : isChecked ? (
                <svg
                  className={`${currentSize.icon} stroke-current`}
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : null}
            </div>
          </div>

          {(label || helperText) && (
            <div className="flex flex-col">
              {label && (
                <span className={`font-medium text-gray-900 dark:text-gray-100 ${currentSize.label}`}>
                  {label}
                </span>
              )}
              {helperText && !hasError && (
                <span className={`text-gray-500 dark:text-gray-400 mt-0.5 ${currentSize.helper}`}>
                  {helperText}
                </span>
              )}
            </div>
          )}
        </label>

        {errorMessage && (
          <span className={`text-status-error font-medium mt-1 pl-7 ${currentSize.helper}`}>
            {errorMessage}
          </span>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
export default Checkbox;
