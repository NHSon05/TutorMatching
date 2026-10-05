import * as React from "react";

export type SwitchSize = "small" | "medium" | "large";
export type SwitchVariant = "primary" | "brand" | "tutor" | "success";

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size" | "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  size?: SwitchSize;
  variant?: SwitchVariant;
  isLoading?: boolean;
}

const sizeConfig: Record<
  SwitchSize,
  {
    track: string;
    thumb: string;
    translate: string;
    label: string;
    helper: string;
    spinner: string;
  }
> = {
  small: {
    track: "w-8 h-4.5 p-0.5",
    thumb: "w-3.5 h-3.5",
    translate: "translate-x-3.5",
    label: "text-xs",
    helper: "text-[11px]",
    spinner: "w-2.5 h-2.5",
  },
  medium: {
    track: "w-11 h-6 p-0.5",
    thumb: "w-5 h-5",
    translate: "translate-x-5",
    label: "text-sm",
    helper: "text-xs",
    spinner: "w-3.5 h-3.5",
  },
  large: {
    track: "w-14 h-7.5 p-1",
    thumb: "w-5.5 h-5.5",
    translate: "translate-x-6.5",
    label: "text-base",
    helper: "text-sm",
    spinner: "w-4 h-4",
  },
};

const activeStyles: Record<SwitchVariant, string> = {
  primary: "bg-gray-900 dark:bg-white focus-visible:ring-gray-900",
  brand: "bg-brand focus-visible:ring-brand",
  tutor: "bg-role-tutor focus-visible:ring-role-tutor",
  success: "bg-status-success focus-visible:ring-status-success",
};

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked: controlledChecked,
      defaultChecked = false,
      onChange,
      disabled = false,
      isLoading = false,
      label,
      helperText,
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

    const generatedId = React.useId();
    const switchId = id || generatedId;
    const currentSize = sizeConfig[size] || sizeConfig.medium;

    const handleToggle = () => {
      if (disabled || isLoading) return;
      const nextChecked = !isChecked;
      if (!isControlled) {
        setUncontrolledChecked(nextChecked);
      }
      onChange?.(nextChecked);
    };

    const isInteractionDisabled = disabled || isLoading;

    return (
      <div
        className={`inline-flex items-start gap-3 select-none ${
          isInteractionDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${className}`}
        onClick={handleToggle}
      >
        <button
          ref={ref}
          id={switchId}
          type="button"
          role="switch"
          aria-checked={isChecked}
          aria-busy={isLoading || undefined}
          disabled={isInteractionDisabled}
          className={`relative inline-flex items-center shrink-0 rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            currentSize.track
          } ${
            isChecked
              ? activeStyles[variant] || activeStyles.primary
              : "bg-gray-200 dark:bg-gray-700 focus-visible:ring-gray-400"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          {...props}
        >
          <span
            className={`pointer-events-none flex items-center justify-center rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              currentSize.thumb
            } ${isChecked ? currentSize.translate : "translate-x-0"}`}
          >
            {isLoading ? (
              <span
                className={`inline-flex shrink-0 items-center justify-center animate-spin text-gray-500 ${currentSize.spinner}`}
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" opacity="0.25" />
                  <path d="M22 12C22 6.47715 17.5228 2 12 2" stroke="currentColor" strokeLinecap="round" />
                </svg>
              </span>
            ) : null}
          </span>
        </button>

        {(label || helperText) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={switchId}
                className={`font-medium text-gray-900 dark:text-gray-100 ${
                  isInteractionDisabled ? "cursor-not-allowed" : "cursor-pointer"
                } ${currentSize.label}`}
                onClick={(e) => e.stopPropagation()}
              >
                {label}
              </label>
            )}
            {helperText && (
              <span className={`text-gray-500 dark:text-gray-400 mt-0.5 ${currentSize.helper}`}>
                {helperText}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";
export default Switch;
