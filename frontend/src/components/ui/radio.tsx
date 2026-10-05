"use client";

import * as React from "react";

export type RadioSize = "small" | "medium" | "large";
export type RadioVariant = "primary" | "brand" | "tutor";

interface RadioGroupContextValue {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  size?: RadioSize;
  variant?: RadioVariant;
  disabled?: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: RadioSize;
  variant?: RadioVariant;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal";
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string | boolean;
  className?: string;
  children: React.ReactNode;
}

export function RadioGroup({
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  size = "medium",
  variant = "primary",
  disabled = false,
  orientation = "vertical",
  label,
  helperText,
  error,
  className = "",
  children,
}: RadioGroupProps) {
  const isControlled = controlledValue !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const resolvedValue = isControlled ? controlledValue : uncontrolledValue;

  const generatedName = React.useId();
  const groupName = name || generatedName;

  const handleChange = React.useCallback(
    (val: string) => {
      if (!isControlled) {
        setUncontrolledValue(val);
      }
      onChange?.(val);
    },
    [isControlled, onChange]
  );

  const contextValue = React.useMemo(
    () => ({
      name: groupName,
      value: resolvedValue,
      onChange: handleChange,
      size,
      variant,
      disabled,
    }),
    [groupName, resolvedValue, handleChange, size, variant, disabled]
  );

  const errorMessage = typeof error === "string" ? error : undefined;

  return (
    <fieldset className={`space-y-2 border-0 p-0 m-0 ${className}`}>
      {label && (
        <legend className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {label}
        </legend>
      )}
      <RadioGroupContext.Provider value={contextValue}>
        <div
          className={`flex ${
            orientation === "horizontal" ? "flex-row flex-wrap gap-5" : "flex-col gap-2.5"
          }`}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
      {helperText && !errorMessage && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helperText}</p>
      )}
      {errorMessage && (
        <p className="text-xs text-status-error font-medium mt-1">{errorMessage}</p>
      )}
    </fieldset>
  );
}

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  value: string;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  size?: RadioSize;
  variant?: RadioVariant;
  error?: boolean;
}

const sizeConfig: Record<
  RadioSize,
  {
    outer: string;
    dot: string;
    label: string;
    helper: string;
  }
> = {
  small: {
    outer: "w-4 h-4",
    dot: "w-1.5 h-1.5",
    label: "text-xs",
    helper: "text-[11px]",
  },
  medium: {
    outer: "w-5 h-5",
    dot: "w-2 h-2",
    label: "text-sm",
    helper: "text-xs",
  },
  large: {
    outer: "w-6 h-6",
    dot: "w-2.5 h-2.5",
    label: "text-base",
    helper: "text-sm",
  },
};

const activeStyles: Record<RadioVariant, { border: string; dot: string; ring: string }> = {
  primary: {
    border: "border-gray-900 dark:border-white",
    dot: "bg-gray-900 dark:bg-white",
    ring: "focus-visible:ring-gray-900",
  },
  brand: {
    border: "border-brand",
    dot: "bg-brand",
    ring: "focus-visible:ring-brand",
  },
  tutor: {
    border: "border-role-tutor",
    dot: "bg-role-tutor",
    ring: "focus-visible:ring-role-tutor",
  },
};

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      value,
      label,
      helperText,
      size: propSize,
      variant: propVariant,
      disabled: propDisabled,
      error = false,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const group = React.useContext(RadioGroupContext);

    const size = propSize || group?.size || "medium";
    const variant = propVariant || group?.variant || "primary";
    const disabled = propDisabled || group?.disabled || false;
    const isChecked = group?.value !== undefined ? group.value === value : props.checked;

    const generatedId = React.useId();
    const inputId = id || generatedId;
    const currentSize = sizeConfig[size] || sizeConfig.medium;
    const currentActive = activeStyles[variant] || activeStyles.primary;

    const handleChange = () => {
      if (disabled) return;
      group?.onChange?.(value);
    };

    return (
      <label
        htmlFor={inputId}
        className={`inline-flex items-start gap-2.5 select-none ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${className}`}
      >
        <div className="relative flex items-center justify-center shrink-0 pt-0.5">
          <input
            ref={ref}
            id={inputId}
            type="radio"
            name={group?.name || props.name}
            value={value}
            checked={isChecked}
            disabled={disabled}
            onChange={handleChange}
            className="peer sr-only"
            {...props}
          />
          <div
            className={`rounded-full flex items-center justify-center shrink-0 border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              currentSize.outer
            } ${
              error
                ? "border-status-error focus-visible:ring-status-error"
                : isChecked
                ? `${currentActive.border} ${currentActive.ring}`
                : "border-gray-300 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 focus-visible:ring-gray-400 shadow-2xs"
            }`}
          >
            {isChecked && (
              <span
                className={`rounded-full shrink-0 transition-transform duration-150 scale-100 ${
                  currentSize.dot
                } ${currentActive.dot}`}
              />
            )}
          </div>
        </div>

        {(label || helperText) && (
          <div className="flex flex-col">
            {label && (
              <span className={`font-medium text-gray-900 dark:text-gray-100 ${currentSize.label}`}>
                {label}
              </span>
            )}
            {helperText && (
              <span className={`text-gray-500 dark:text-gray-400 mt-0.5 ${currentSize.helper}`}>
                {helperText}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Radio.displayName = "Radio";
export default Radio;
