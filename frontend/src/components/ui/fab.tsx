import * as React from "react";

export type FABPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left"
  | "none";

export type FABVariant = "primary" | "brand" | "tutor" | "success";
export type FABSize = "small" | "medium" | "large";

export interface FABProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: React.ReactNode;
  position?: FABPosition;
  variant?: FABVariant;
  size?: FABSize;
}

const positionStyles: Record<FABPosition, string> = {
  "bottom-right": "fixed bottom-6 right-6 z-40",
  "bottom-left": "fixed bottom-6 left-6 z-40",
  "top-right": "fixed top-6 right-6 z-40",
  "top-left": "fixed top-6 left-6 z-40",
  none: "relative",
};

const variantStyles: Record<FABVariant, string> = {
  primary: "bg-gray-900 text-white hover:bg-gray-800 focus-visible:ring-gray-900 shadow-lg dark:bg-white dark:text-gray-900",
  brand: "bg-brand text-white hover:bg-brand-hover focus-visible:ring-brand shadow-lg",
  tutor: "bg-role-tutor text-white hover:bg-tutor-700 focus-visible:ring-role-tutor shadow-lg",
  success: "bg-status-success text-white hover:bg-status-success-dark focus-visible:ring-status-success shadow-lg",
};

const sizeStyles: Record<FABSize, { button: string; icon: string; text: string }> = {
  small: { button: "h-10 min-w-10 px-3", icon: "w-4 h-4", text: "text-xs" },
  medium: { button: "h-13 min-w-13 px-4", icon: "w-5 h-5", text: "text-sm" },
  large: { button: "h-15 min-w-15 px-5", icon: "w-6 h-6", text: "text-base" },
};

export function FAB({
  icon,
  label,
  position = "bottom-right",
  variant = "brand",
  size = "medium",
  disabled = false,
  className = "",
  type = "button",
  ...props
}: FABProps) {
  const currentSize = sizeStyles[size] || sizeStyles.medium;
  const isExtended = Boolean(label);

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 select-none cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        positionStyles[position]
      } ${variantStyles[variant] || variantStyles.brand} ${currentSize.button} ${
        disabled ? "opacity-50 cursor-not-allowed active:scale-100" : "hover:scale-105"
      } ${className}`}
      {...props}
    >
      <span className={`shrink-0 ${currentSize.icon}`}>{icon}</span>
      {isExtended && <span className={currentSize.text}>{label}</span>}
    </button>
  );
}

export default FAB;
