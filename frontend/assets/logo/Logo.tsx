import React, { useId } from "react";

export type LogoVariant = "gradient" | "white";

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: LogoVariant;
  size?: number | string;
}

export function Logo({
  variant = "gradient",
  size,
  className = "",
  strokeWidth = 2.5,
  ...props
}: LogoProps) {
  const id = useId();
  const gradientId = `logo-gradient-${id.replace(/:/g, "")}`;

  const strokeColor =
    variant === "gradient" ? `url(#${gradientId})` : "currentColor";

  const colorClass = variant === "white" ? "text-white" : "";
  const sizeClass = size ? "" : (!/\b[wh]-\d+/.test(className) ? "w-7 h-7" : "");

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={`${sizeClass} ${colorClass} ${className}`.trim()}
      {...props}
    >
      {variant === "gradient" && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      )}
      <circle cx="12" cy="7" r="4" />
      <circle cx="7" cy="16" r="4" />
      <circle cx="17" cy="16" r="4" />
    </svg>
  );
}

export default Logo;
