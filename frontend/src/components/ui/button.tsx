import * as React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "brand"
  | "tutor"
  | "danger"
  | "success";

export type ButtonSize = "small" | "medium" | "large";
export type ButtonShape = "rounded" | "pill";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant of the button:
   * - primary: Dark solid background (main action)
   * - secondary: Border only, transparent background
   * - tertiary: No border, no background (subtle action)
   * - brand: Blue brand color background (Learner / Public CTA)
   * - tutor: Amber color background (Tutor workspace)
   * - danger: Crimson red background (Admin / Destructive action)
   * - success: Emerald green background (Approval / Confirmation)
   * @default 'primary'
   */
  variant?: ButtonVariant;

  /**
   * Size of the button:
   * - small: 36px height, compact
   * - medium: 44px height, default
   * - large: 48px height
   * @default 'medium'
   */
  size?: ButtonSize;

  /**
   * Border radius shape:
   * - rounded: Default rounded corners
   * - pill: Fully rounded (pill shape)
   * @default 'rounded'
   */
  shape?: ButtonShape;

  /**
   * Icon displayed before the button text
   */
  leadingIcon?: React.ReactNode;

  /**
   * Icon displayed after the button text
   */
  trailingIcon?: React.ReactNode;

  /**
   * Badge count or text to display after the text (for filters, counts, etc.)
   */
  badge?: string | number;

  /**
   * Shows loading spinner and disables user interaction
   * @default false
   */
  isLoading?: boolean;

  /**
   * Makes button take the full width of its container
   * @default false
   */
  isFullWidth?: boolean;

  /**
   * When true, renders children directly instead of button element (slot pattern).
   * Useful for Next.js Link or custom wrapper tags.
   * @default false
   */
  asChild?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
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
};

const badgeStylesByVariant: Record<ButtonVariant, string> = {
  primary:
    "bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900",
  secondary:
    "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900",
  tertiary:
    "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100",
  brand: "bg-white/25 text-white",
  tutor: "bg-white/25 text-white",
  danger: "bg-white/25 text-white",
  success: "bg-white/25 text-white",
};

const sizeStyles: Record<
  ButtonSize,
  {
    button: string;
    icon: string;
    spinner: string;
    badge: string;
  }
> = {
  small: {
    button: "h-9 px-3.5 text-xs gap-1.5",
    icon: "w-4 h-4 text-xs",
    spinner: "w-3.5 h-3.5",
    badge: "text-[10px] px-1.5 py-0.5 min-w-[18px]",
  },
  medium: {
    button: "h-11 px-4 text-sm gap-2",
    icon: "w-5 h-5 text-sm",
    spinner: "w-4 h-4",
    badge: "text-xs px-2 py-0.5 min-w-[20px]",
  },
  large: {
    button: "h-12 px-5 text-base gap-2.5",
    icon: "w-5 h-5 text-base",
    spinner: "w-5 h-5",
    badge: "text-xs px-2 py-0.5 min-w-[22px]",
  },
};

const shapeStyles: Record<ButtonShape, string> = {
  rounded: "rounded-xl",
  pill: "rounded-full",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "medium",
      shape = "rounded",
      leadingIcon,
      trailingIcon,
      badge,
      isLoading = false,
      isFullWidth = false,
      asChild = false,
      disabled = false,
      className = "",
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isInteractionDisabled = disabled || isLoading;
    const currentSize = sizeStyles[size] || sizeStyles.medium;

    const baseClass =
      "inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]";

    const combinedClassName = [
      baseClass,
      variantStyles[variant] || variantStyles.primary,
      currentSize.button,
      shapeStyles[shape] || shapeStyles.rounded,
      isFullWidth ? "w-full" : "w-auto",
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

    const badgeContent =
      badge !== undefined && badge !== null ? (
        <span
          className={`inline-flex items-center justify-center font-semibold rounded-full leading-none shrink-0 ${
            badgeStylesByVariant[variant] || badgeStylesByVariant.primary
          } ${currentSize.badge}`}
        >
          {badge}
        </span>
      ) : null;

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

    const leadingIconContent =
      !isLoading && leadingIcon ? (
        <span
          className={`inline-flex shrink-0 items-center justify-center ${currentSize.icon}`}
          aria-hidden="true"
        >
          {leadingIcon}
        </span>
      ) : null;

    const trailingIconContent =
      !isLoading && trailingIcon ? (
        <span
          className={`inline-flex shrink-0 items-center justify-center ${currentSize.icon}`}
          aria-hidden="true"
        >
          {trailingIcon}
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
        "aria-disabled": isInteractionDisabled || undefined,
        "aria-busy": isLoading || undefined,
        ...props,
        children: (
          <>
            {isLoading && spinnerContent}
            {leadingIconContent}
            {child.props.children && <span>{child.props.children}</span>}
            {badgeContent}
            {trailingIconContent}
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
        data-loading={isLoading ? "true" : undefined}
        className={combinedClassName}
        {...props}
      >
        {isLoading && spinnerContent}
        {leadingIconContent}
        {children && <span>{children}</span>}
        {badgeContent}
        {trailingIconContent}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
