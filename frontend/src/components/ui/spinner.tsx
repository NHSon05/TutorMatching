import * as React from "react";

export type SpinnerSize = "small" | "medium" | "large" | "xlarge";
export type SpinnerVariant = "primary" | "brand" | "tutor" | "white" | "gray";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: React.ReactNode;
}

const sizeConfig: Record<SpinnerSize, { spinner: string; text: string }> = {
  small: { spinner: "w-4 h-4 border-2", text: "text-xs" },
  medium: { spinner: "w-6 h-6 border-2.5", text: "text-sm" },
  large: { spinner: "w-8 h-8 border-3", text: "text-base font-medium" },
  xlarge: { spinner: "w-12 h-12 border-4", text: "text-lg font-semibold" },
};

const variantStyles: Record<SpinnerVariant, string> = {
  primary: "text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 border-t-current",
  brand: "text-brand border-brand/20 border-t-brand",
  tutor: "text-role-tutor border-role-tutor/20 border-t-role-tutor",
  white: "text-white border-white/20 border-t-white",
  gray: "text-gray-500 border-gray-200 dark:border-gray-800 border-t-gray-500",
};

export function Spinner({
  size = "medium",
  variant = "brand",
  label,
  className = "",
  ...props
}: SpinnerProps) {
  const currentSize = sizeConfig[size] || sizeConfig.medium;

  return (
    <div
      role="status"
      aria-label={typeof label === "string" ? label : "Đang tải..."}
      className={`inline-flex items-center justify-center gap-2.5 ${className}`}
      {...props}
    >
      <div
        className={`rounded-full animate-spin shrink-0 ${currentSize.spinner} ${
          variantStyles[variant] || variantStyles.brand
        }`}
      />
      {label && (
        <span className={`text-gray-600 dark:text-gray-400 ${currentSize.text}`}>
          {label}
        </span>
      )}
    </div>
  );
}

export default Spinner;
