import * as React from "react";

export type AvatarSize = "xsmall" | "small" | "medium" | "large" | "xlarge";
export type AvatarShape = "circle" | "rounded";
export type AvatarStatus = "online" | "offline" | "busy" | "away";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallbackText?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  status?: AvatarStatus;
}

const sizeConfig: Record<
  AvatarSize,
  {
    box: string;
    text: string;
    status: string;
  }
> = {
  xsmall: { box: "w-6 h-6", text: "text-[10px]", status: "w-1.5 h-1.5 border" },
  small: { box: "w-8 h-8", text: "text-xs", status: "w-2 h-2 border" },
  medium: { box: "w-10 h-10", text: "text-sm", status: "w-2.5 h-2.5 border-2" },
  large: { box: "w-12 h-12", text: "text-base", status: "w-3 h-3 border-2" },
  xlarge: { box: "w-16 h-16", text: "text-lg", status: "w-3.5 h-3.5 border-2" },
};

const statusColors: Record<AvatarStatus, string> = {
  online: "bg-emerald-500",
  busy: "bg-red-500",
  away: "bg-amber-500",
  offline: "bg-gray-400",
};

export function Avatar({
  src,
  alt = "Avatar",
  fallbackText,
  size = "medium",
  shape = "circle",
  status,
  className = "",
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = React.useState(false);
  const currentSize = sizeConfig[size] || sizeConfig.medium;
  const isCircle = shape === "circle";

  const getInitials = (text?: string) => {
    if (!text) return "";
    const parts = text.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(fallbackText || alt);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        currentSize.box
      } ${className}`}
      {...props}
    >
      <div
        className={`w-full h-full overflow-hidden flex items-center justify-center font-bold ${
          isCircle ? "rounded-full" : "rounded-xl"
        } ${
          src && !hasError
            ? "bg-gray-100 dark:bg-gray-800"
            : "bg-brand/10 text-brand border border-brand/20"
        }`}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={currentSize.text}>{initials || "?"}</span>
        )}
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-white dark:border-gray-900 ${
            currentSize.status
          } ${statusColors[status]}`}
          aria-label={`Trạng thái: ${status}`}
        />
      )}
    </div>
  );
}

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  children: React.ReactNode;
}

export function AvatarGroup({
  max = 4,
  children,
  className = "",
  ...props
}: AvatarGroupProps) {
  const childArray = React.Children.toArray(children);
  const visible = childArray.slice(0, max);
  const remaining = childArray.length - max;

  return (
    <div
      className={`inline-flex items-center -space-x-2.5 overflow-hidden ${className}`}
      {...props}
    >
      {visible.map((child, idx) => (
        <div key={idx} className="ring-2 ring-white dark:ring-gray-900 rounded-full">
          {child}
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-2 ring-white dark:ring-gray-900 flex items-center justify-center text-xs font-bold shrink-0">
          +{remaining}
        </div>
      )}
    </div>
  );
}

export default Avatar;
