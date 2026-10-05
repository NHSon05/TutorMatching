import * as React from "react";

export type BadgeVariant =
  | "gray"
  | "brand"
  | "tutor"
  | "admin"
  | "success"
  | "warning"
  | "error";

export type BadgeAppearance = "subtle" | "solid" | "outline";
export type BadgeShape = "rounded" | "pill";
export type BadgeSize = "small" | "medium" | "large";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  appearance?: BadgeAppearance;
  shape?: BadgeShape;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
}

const colorStyles: Record<
  BadgeVariant,
  Record<BadgeAppearance, { base: string; dot: string }>
> = {
  gray: {
    subtle: { base: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700", dot: "bg-gray-500" },
    solid: { base: "bg-gray-900 text-white border-transparent dark:bg-white dark:text-gray-900", dot: "bg-white dark:bg-gray-900" },
    outline: { base: "bg-transparent text-gray-700 border-gray-300 dark:text-gray-300 dark:border-gray-700", dot: "bg-gray-500" },
  },
  brand: {
    subtle: { base: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900", dot: "bg-brand" },
    solid: { base: "bg-brand text-white border-transparent", dot: "bg-white" },
    outline: { base: "bg-transparent text-brand border-brand/40", dot: "bg-brand" },
  },
  tutor: {
    subtle: { base: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900", dot: "bg-role-tutor" },
    solid: { base: "bg-role-tutor text-white border-transparent", dot: "bg-white" },
    outline: { base: "bg-transparent text-role-tutor border-role-tutor/40", dot: "bg-role-tutor" },
  },
  admin: {
    subtle: { base: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900", dot: "bg-rose-600" },
    solid: { base: "bg-rose-600 text-white border-transparent", dot: "bg-white" },
    outline: { base: "bg-transparent text-rose-600 border-rose-300 dark:border-rose-800", dot: "bg-rose-600" },
  },
  success: {
    subtle: { base: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900", dot: "bg-status-success" },
    solid: { base: "bg-status-success text-white border-transparent", dot: "bg-white" },
    outline: { base: "bg-transparent text-status-success border-status-success/40", dot: "bg-status-success" },
  },
  warning: {
    subtle: { base: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900", dot: "bg-status-warning" },
    solid: { base: "bg-status-warning text-white border-transparent", dot: "bg-white" },
    outline: { base: "bg-transparent text-status-warning border-status-warning/40", dot: "bg-status-warning" },
  },
  error: {
    subtle: { base: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900", dot: "bg-status-error" },
    solid: { base: "bg-status-error text-white border-transparent", dot: "bg-white" },
    outline: { base: "bg-transparent text-status-error border-status-error/40", dot: "bg-status-error" },
  },
};

const sizeStyles = {
  small: "text-[10px] px-1.5 py-0.5 gap-1",
  medium: "text-xs px-2.5 py-0.5 gap-1.5",
  large: "text-sm px-3 py-1 gap-2",
};

export function Badge({
  variant = "gray",
  appearance = "subtle",
  shape = "pill",
  size = "medium",
  dot = false,
  icon,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const currentColors = colorStyles[variant]?.[appearance] || colorStyles.gray.subtle;
  const currentShape = shape === "pill" ? "rounded-full" : "rounded-md";

  return (
    <span
      className={`inline-flex items-center font-semibold border select-none transition-colors ${
        sizeStyles[size]
      } ${currentShape} ${currentColors.base} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentColors.dot}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
