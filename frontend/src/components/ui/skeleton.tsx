import * as React from "react";

export type SkeletonVariant = "text" | "rectangular" | "circular";
export type SkeletonAnimation = "pulse" | "wave" | "none";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  animation?: SkeletonAnimation;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = "rectangular",
  animation = "pulse",
  width,
  height,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const variantClass = {
    text: "h-4 w-full rounded-md",
    rectangular: "rounded-xl",
    circular: "rounded-full shrink-0",
  }[variant];

  const animationClass = {
    pulse: "animate-pulse",
    wave: "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
    none: "",
  }[animation];

  const customStyle: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    ...style,
  };

  return (
    <div
      aria-hidden="true"
      style={customStyle}
      className={`bg-gray-200 dark:bg-gray-800 select-none ${variantClass} ${animationClass} ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
