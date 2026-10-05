import * as React from "react";

export type SliderVariant = "primary" | "brand" | "tutor";

export interface SliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  formatValue?: (value: number) => string;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  showValueTooltip?: boolean;
  marks?: Array<{ value: number; label?: string }>;
  disabled?: boolean;
  variant?: SliderVariant;
  className?: string;
  id?: string;
}

const trackVariantStyles: Record<SliderVariant, string> = {
  primary: "bg-gray-900 dark:bg-white",
  brand: "bg-brand",
  tutor: "bg-role-tutor",
};

const thumbVariantStyles: Record<SliderVariant, string> = {
  primary: "border-gray-900 dark:border-white focus-visible:ring-gray-900",
  brand: "border-brand focus-visible:ring-brand",
  tutor: "border-role-tutor focus-visible:ring-role-tutor",
};

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value: controlledValue,
      defaultValue,
      min = 0,
      max = 100,
      step = 1,
      onChange,
      formatValue = (v) => `${v}`,
      label,
      helperText,
      showValueTooltip = true,
      marks,
      disabled = false,
      variant = "brand",
      className = "",
      id,
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined;
    const initialVal = defaultValue !== undefined ? defaultValue : min;
    const [uncontrolledValue, setUncontrolledValue] = React.useState(initialVal);
    const currentValue = isControlled ? controlledValue : uncontrolledValue;

    const generatedId = React.useId();
    const sliderId = id || generatedId;

    const percentage = Math.max(0, Math.min(100, ((currentValue - min) / (max - min)) * 100));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextVal = Number(e.target.value);
      if (!isControlled) {
        setUncontrolledValue(nextVal);
      }
      onChange?.(nextVal);
    };

    return (
      <div className={`w-full space-y-2 ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
        {(label || showValueTooltip) && (
          <div className="flex items-center justify-between text-sm">
            {label && (
              <label htmlFor={sliderId} className="font-medium text-gray-900 dark:text-gray-100">
                {label}
              </label>
            )}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {formatValue(currentValue)}
            </span>
          </div>
        )}

        <div className="relative flex items-center h-6 select-none">
          {/* Background Track */}
          <div className="absolute w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {/* Active Highlight Track */}
            <div
              className={`h-full ${trackVariantStyles[variant] || trackVariantStyles.brand}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Native Range Input for accessibility & keyboard drag */}
          <input
            ref={ref}
            id={sliderId}
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentValue}
            disabled={disabled}
            onChange={handleChange}
            className="absolute w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={currentValue}
            aria-valuetext={formatValue(currentValue)}
          />

          {/* Custom Styled Thumb */}
          <div
            className={`pointer-events-none absolute w-5 h-5 bg-white rounded-full border-2 shadow-sm transition-transform duration-75 ease-out -translate-x-1/2 ${
              thumbVariantStyles[variant] || thumbVariantStyles.brand
            }`}
            style={{ left: `${percentage}%` }}
          />
        </div>

        {marks && marks.length > 0 && (
          <div className="relative flex justify-between text-[11px] text-gray-400 dark:text-gray-500 pt-0.5">
            {marks.map((m) => {
              const markPercent = ((m.value - min) / (max - min)) * 100;
              return (
                <span
                  key={m.value}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${markPercent}%` }}
                >
                  {m.label || m.value}
                </span>
              );
            })}
          </div>
        )}

        {helperText && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Slider.displayName = "Slider";
export default Slider;
