import * as React from "react";

export type IconButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "brand"
  | "tutor"
  | "danger"
  | "success"
  | "ghost";

export type IconButtonSize = "xsmall" | "small" | "medium" | "large";
export type IconButtonShape = "rounded" | "circle" | "pill";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Accessible label for screen readers. Essential since icon buttons contain no visible text.
   */
  "aria-label": string;

  /**
   * Visual variant of the icon button:
   * - primary: Dark solid background (main action)
   * - secondary: Border only, transparent background
   * - tertiary: No border, transparent background
   * - brand: Blue brand color background (Learner / Public CTA)
   * - tutor: Amber color background (Tutor workspace)
   * - danger: Crimson red background (Admin / Destructive action)
   * - success: Emerald green background (Approval / Confirmation)
   * - ghost: Subtle transparent background, hover tint (navbars / headers)
   * @default 'primary'
   */
  variant?: IconButtonVariant;

  /**
   * Size of the button:
   * - xsmall: 28px height/width, compact
   * - small: 36px height/width, standard compact
   * - medium: 44px height/width, default
   * - large: 48px height/width, prominent
   * @default 'medium'
   */
  size?: IconButtonSize;

  /**
   * Border radius shape:
   * - rounded: Rounded-xl corners
   * - circle / pill: Fully circular (rounded-full)
   * @default 'rounded'
   */
  shape?: IconButtonShape;

  /**
   * Optional icon node. Can alternatively be passed as children.
   */
  icon?: React.ReactNode;

  /**
   * Badge content or boolean notification dot:
   * - string | number: Count pill pinned to top-right
   * - true: Dot indicator pinned to top-right
   */
  badge?: string | number | boolean;

  /**
   * Optional browser tooltip displayed on hover (maps to title attribute).
   */
  tooltip?: string;

  /**
   * Shows loading spinner and disables user interaction.
   * @default false
   */
  isLoading?: boolean;

  /**
   * When true, renders children directly instead of button element (slot pattern).
   * Useful for Next.js Link or custom wrapper tags.
   * @default false
   */
  asChild?: boolean;
}

const variantStyles: Record<IconButtonVariant, string> = {
  primary:
    "bg-gray-900 text-white hover:bg-gray-800 active:bg-black focus-visible:ring-gray-900 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-sm",
  secondary:
    "border border-border-default bg-transparent text-content-primary hover:bg-gray-100 active:bg-gray-200/80 focus-visible:ring-gray-400 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-700 shadow-xs",
  tertiary:
    "border-transparent bg-transparent text-content-primary hover:bg-gray-100 active:bg-gray-200/70 focus-visible:ring-gray-400 dark:text-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-700",
  brand:
    "bg-brand text-white hover:bg-brand-hover active:bg-brand-800 focus-visible:ring-brand shadow-sm",
  tutor:
    "bg-role-tutor text-white hover:bg-tutor-700 active:bg-tutor-800 focus-visible:ring-role-tutor shadow-sm",
  danger:
    "bg-status-error text-white hover:bg-admin-700 active:bg-admin-800 focus-visible:ring-status-error shadow-sm",
  success:
    "bg-status-success text-white hover:bg-status-success-dark active:bg-emerald-800 focus-visible:ring-status-success shadow-sm",
  ghost:
    "border-transparent bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200/70 focus-visible:ring-gray-400 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800",
};

const sizeStyles: Record<
  IconButtonSize,
  {
    button: string;
    icon: string;
    spinner: string;
    badgeOffset: string;
  }
> = {
  xsmall: {
    button: "w-7 h-7 min-w-7 min-h-7 text-xs",
    icon: "w-3.5 h-3.5",
    spinner: "w-3 h-3",
    badgeOffset: "-top-1 -right-1",
  },
  small: {
    button: "w-9 h-9 min-w-9 min-h-9 text-xs",
    icon: "w-4 h-4",
    spinner: "w-3.5 h-3.5",
    badgeOffset: "-top-1 -right-1",
  },
  medium: {
    button: "w-11 h-11 min-w-11 min-h-11 text-sm",
    icon: "w-5 h-5",
    spinner: "w-4 h-4",
    badgeOffset: "-top-1.5 -right-1.5",
  },
  large: {
    button: "w-12 h-12 min-w-12 min-h-12 text-base",
    icon: "w-6 h-6",
    spinner: "w-5 h-5",
    badgeOffset: "-top-1.5 -right-1.5",
  },
};

const shapeStyles: Record<IconButtonShape, string> = {
  rounded: "rounded-xl",
  circle: "rounded-full",
  pill: "rounded-full",
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      "aria-label": ariaLabel,
      variant = "primary",
      size = "medium",
      shape = "rounded",
      icon,
      badge,
      tooltip,
      isLoading = false,
      asChild = false,
      disabled = false,
      className = "",
      children,
      type = "button",
      title,
      ...props
    },
    ref
  ) => {
    const isInteractionDisabled = disabled || isLoading;
    const currentSize = sizeStyles[size] || sizeStyles.medium;
    const resolvedTitle = tooltip || title || ariaLabel;

    const baseClass =
      "relative inline-flex items-center justify-center shrink-0 aspect-square font-medium transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96]";

    const combinedClassName = [
      baseClass,
      variantStyles[variant] || variantStyles.primary,
      currentSize.button,
      shapeStyles[shape] || shapeStyles.rounded,
      disabled
        ? "opacity-50 cursor-not-allowed active:scale-100"
        : "",
      isLoading
        ? "cursor-wait opacity-80 pointer-events-none active:scale-100"
        : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const spinnerContent = (
      <span
        className={`inline-flex shrink-0 items-center justify-center animate-spin ${currentSize.spinner}`}
        aria-hidden="true"
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2.5"
            opacity="0.25"
          />
          <path
            d="M22 12C22 6.47715 17.5228 2 12 2"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );

    const badgeContent = (() => {
      if (badge === true) {
        return (
          <span
            className={`absolute ${currentSize.badgeOffset} w-2.5 h-2.5 bg-status-error rounded-full ring-2 ring-white dark:ring-gray-900 shrink-0 pointer-events-none`}
            aria-hidden="true"
          />
        );
      }
      if (typeof badge === "string" || typeof badge === "number") {
        return (
          <span
            className={`absolute ${currentSize.badgeOffset} inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-status-error rounded-full ring-2 ring-white dark:ring-gray-900 leading-none shrink-0 pointer-events-none shadow-xs`}
            aria-hidden="true"
          >
            {badge}
          </span>
        );
      }
      return null;
    })();

    const iconContent = !isLoading ? (
      <span
        className={`inline-flex shrink-0 items-center justify-center ${currentSize.icon}`}
        aria-hidden="true"
      >
        {icon || children}
      </span>
    ) : null;

    if (asChild && React.isValidElement(children)) {
      interface ChildElementProps extends React.HTMLAttributes<HTMLElement> {
        ref?: React.Ref<unknown>;
      }
      const child = children as React.ReactElement<ChildElementProps>;
      return React.cloneElement(child, {
        ref: ref || child.props.ref,
        className: `${combinedClassName} ${child.props.className || ""}`.trim(),
        "aria-label": ariaLabel,
        title: resolvedTitle,
        "aria-disabled": isInteractionDisabled || undefined,
        "aria-busy": isLoading || undefined,
        ...props,
        children: (
          <>
            {isLoading ? spinnerContent : icon || child.props.children}
            {badgeContent}
          </>
        ),
      });
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isInteractionDisabled}
        aria-disabled={isInteractionDisabled}
        aria-busy={isLoading}
        aria-label={ariaLabel}
        title={resolvedTitle}
        data-loading={isLoading ? "true" : undefined}
        className={combinedClassName}
        {...props}
      >
        {isLoading ? spinnerContent : iconContent}
        {badgeContent}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
export default IconButton;
