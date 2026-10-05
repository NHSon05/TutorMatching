import * as React from "react";

export type WelcomeBannerVariant = "brand" | "tutor" | "gradient" | "gray";

export interface WelcomeBannerProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  illustration?: React.ReactNode;
  variant?: WelcomeBannerVariant;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<
  WelcomeBannerVariant,
  {
    container: string;
    title: string;
    desc: string;
  }
> = {
  brand: {
    container: "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent",
    title: "text-white",
    desc: "text-blue-100",
  },
  tutor: {
    container: "bg-gradient-to-r from-amber-600 to-orange-700 text-white border-transparent",
    title: "text-white",
    desc: "text-amber-100",
  },
  gradient: {
    container: "bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 text-white border-transparent",
    title: "text-white",
    desc: "text-gray-300",
  },
  gray: {
    container: "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-800",
    title: "text-gray-900 dark:text-gray-100",
    desc: "text-gray-500 dark:text-gray-400",
  },
};

export function WelcomeBanner({
  title,
  description,
  action,
  illustration,
  variant = "brand",
  onDismiss,
  className = "",
}: WelcomeBannerProps) {
  const styles = variantStyles[variant] || variantStyles.brand;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-xs transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
        styles.container
      } ${className}`}
    >
      {/* Text Info */}
      <div className="max-w-xl z-10 space-y-2">
        <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${styles.title}`}>
          {title}
        </h2>
        {description && (
          <p className={`text-xs sm:text-sm leading-relaxed ${styles.desc}`}>
            {description}
          </p>
        )}
        {action && <div className="pt-2">{action}</div>}
      </div>

      {/* Optional Illustration */}
      {illustration && (
        <div className="shrink-0 z-10 self-center sm:self-auto">
          {illustration}
        </div>
      )}

      {/* Dismiss Button */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng banner"
          className="absolute top-4 right-4 p-1.5 opacity-70 hover:opacity-100 rounded-xl transition-opacity cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Background Glow Effect */}
      <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
}

export default WelcomeBanner;
