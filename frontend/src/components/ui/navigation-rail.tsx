"use client";

import * as React from "react";

// ============================================================================
// CONTEXT
// ============================================================================

interface NavigationRailContextValue {
  mode: "expanded" | "collapsed";
  size: "sm" | "md";
}

const NavigationRailContext = React.createContext<NavigationRailContextValue>({
  mode: "expanded",
  size: "md",
});

export const useNavigationRail = () => React.useContext(NavigationRailContext);

// ============================================================================
// TYPES
// ============================================================================

export type NavigationRailMode = "expanded" | "collapsed";
export type NavigationRailSize = "sm" | "md";

export type NavItemBadgeVariant = "primary" | "secondary";

export type NavItemBadgeColor =
  | "gray"
  | "black"
  | "white"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "mint"
  | "teal"
  | "cyan"
  | "blue"
  | "indigo"
  | "purple"
  | "pink"
  | "brown";

export interface NavItemChildItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  badgeVariant?: NavItemBadgeVariant;
  badgeColor?: NavItemBadgeColor;
  selected?: boolean;
  disabled?: boolean;
  size?: NavigationRailSize;
  href?: string;
  onClick?: (id: string) => void;
  children?: NavItemChildItem[];
}

export interface NavItemProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  badgeVariant?: NavItemBadgeVariant;
  badgeColor?: NavItemBadgeColor;
  selected?: boolean;
  disabled?: boolean;
  children?: NavItemChildItem[] | React.ReactNode;
  nestedItems?: NavItemChildItem[];
  level?: number;
  size?: NavigationRailSize;
  href?: string;
  onClick?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface NavGroupProps {
  label: string;
  expanded?: boolean;
  hideChevron?: boolean;
  badge?: boolean;
  children?: React.ReactNode;
  onToggle?: () => void;
  size?: NavigationRailSize;
  isFirstGroup?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface NavigationRailProps {
  mode?: NavigationRailMode;
  header?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  expandedWidth?: number;
  height?: string | number;
  floating?: boolean;
  showFooterDivider?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// ============================================================================
// BADGE COLOR STYLES
// ============================================================================

const badgeColorMap: Record<NavItemBadgeColor, { primary: string; secondary: string }> = {
  black: {
    primary: "bg-gray-900 text-white dark:bg-white dark:text-gray-900",
    secondary: "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
  gray: {
    primary: "bg-gray-700 text-white dark:bg-gray-300 dark:text-gray-900",
    secondary: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  white: {
    primary: "bg-white text-gray-900 border border-gray-200 shadow-xs",
    secondary: "bg-white/80 text-gray-700 border border-gray-100",
  },
  red: {
    primary: "bg-red-600 text-white dark:bg-red-500",
    secondary: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  orange: {
    primary: "bg-orange-600 text-white dark:bg-orange-500",
    secondary: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  },
  yellow: {
    primary: "bg-amber-500 text-black dark:bg-amber-400",
    secondary: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  },
  green: {
    primary: "bg-emerald-600 text-white dark:bg-emerald-500",
    secondary: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  mint: {
    primary: "bg-teal-500 text-white",
    secondary: "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300",
  },
  teal: {
    primary: "bg-teal-700 text-white",
    secondary: "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300",
  },
  cyan: {
    primary: "bg-cyan-600 text-white",
    secondary: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300",
  },
  blue: {
    primary: "bg-blue-600 text-white dark:bg-blue-500",
    secondary: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  },
  indigo: {
    primary: "bg-indigo-600 text-white dark:bg-indigo-500",
    secondary: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
  },
  purple: {
    primary: "bg-purple-600 text-white dark:bg-purple-500",
    secondary: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
  },
  pink: {
    primary: "bg-pink-600 text-white dark:bg-pink-500",
    secondary: "bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-300",
  },
  brown: {
    primary: "bg-stone-700 text-white",
    secondary: "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200",
  },
};

// ============================================================================
// ICONS
// ============================================================================

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ============================================================================
// NAV ITEM COMPONENT
// ============================================================================

export function NavItem({
  id,
  label,
  icon,
  badge,
  badgeVariant = "primary",
  badgeColor = "black",
  selected = false,
  disabled = false,
  children,
  nestedItems,
  level = 0,
  size,
  href,
  onClick,
  className = "",
  style,
}: NavItemProps) {
  const context = useNavigationRail();
  const effectiveSize = size || context.size || "md";
  const isCollapsed = context.mode === "collapsed";

  const [isOpen, setIsOpen] = React.useState(false);

  // Normalize nested item list
  const childList =
    nestedItems ||
    (Array.isArray(children) ? (children as NavItemChildItem[]) : undefined);
  const hasChildren = Boolean(childList ? childList.length > 0 : children);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (hasChildren && !isCollapsed) {
      setIsOpen((prev) => !prev);
    }
    if (onClick) {
      onClick(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (hasChildren && !isCollapsed) {
        setIsOpen((prev) => !prev);
      }
      if (onClick) {
        onClick(id);
      }
    }
  };

  // If in collapsed mode and item has NO icon, hide it (Photonix spec: _navigationRailNavItemNoIcon)
  if (isCollapsed && !icon) {
    return null;
  }

  // Badges styling
  const colorToken = badgeColorMap[badgeColor] || badgeColorMap.black;
  const badgeClasses = badgeVariant === "secondary" ? colorToken.secondary : colorToken.primary;

  // Sizes
  const heightClass = effectiveSize === "sm" ? "h-8" : "h-12";
  const iconSizeClass = effectiveSize === "sm" ? "w-5 h-5 text-sm" : "w-6 h-6 text-base";
  const textSizeClass = effectiveSize === "sm" ? "text-sm" : "text-base";

  // Nesting indent
  const indentPaddingLeft = level > 0 && !isCollapsed ? `${level * 24 + 12}px` : undefined;

  // Selected & Hover styling
  const stateStyles = disabled
    ? "opacity-40 cursor-not-allowed pointer-events-none text-gray-400 dark:text-gray-600"
    : selected
    ? "bg-blue-50 text-brand-700 font-semibold dark:bg-blue-950/40 dark:text-blue-300"
    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white";

  // Render Inner Content
  const itemContent = isCollapsed ? (
    // COLLAPSED MODE
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-current={selected ? "page" : undefined}
      aria-disabled={disabled}
      title={label}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative w-12 h-12 mx-auto rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150 select-none ${stateStyles} ${className}`}
      style={style}
    >
      <div className={`flex items-center justify-center shrink-0 ${iconSizeClass}`}>
        {icon}
      </div>
      {typeof badge === "number" && (
        <span
          className={`absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-gray-900 ${badgeClasses}`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </div>
  ) : (
    // EXPANDED MODE
    <div className="flex flex-col w-full relative">
      {/* Elbow tree line for nested items */}
      {level > 0 && (
        <div
          aria-hidden="true"
          className="absolute left-4 top-0 bottom-1/2 w-3 border-b border-l border-gray-300 dark:border-gray-700 rounded-bl-sm pointer-events-none"
        />
      )}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-current={selected ? "page" : undefined}
        aria-disabled={disabled}
        aria-expanded={hasChildren ? isOpen : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`w-full ${heightClass} px-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors duration-150 select-none ${stateStyles} ${className}`}
        style={{
          paddingLeft: indentPaddingLeft,
          ...style,
        }}
      >
        {icon && (
          <span
            className={`flex items-center justify-center shrink-0 transition-colors ${
              selected
                ? "text-brand-600 dark:text-brand-400"
                : "text-gray-500 dark:text-gray-400"
            } ${iconSizeClass}`}
          >
            {icon}
          </span>
        )}
        <span className={`truncate flex-1 font-medium ${textSizeClass}`}>
          {label}
        </span>
        {typeof badge === "number" && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${badgeClasses}`}
          >
            {badge}
          </span>
        )}
        {hasChildren && (
          <span
            className={`shrink-0 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-90" : "rotate-0"
            }`}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </span>
        )}
      </div>

      {/* Nested Children Accordion */}
      {hasChildren && isOpen && (
        <div className="flex flex-col w-full mt-0.5 space-y-0.5 relative pl-3">
          {/* Continuous vertical tree trunk line */}
          <div
            aria-hidden="true"
            className="absolute left-4 top-0 bottom-2 w-px bg-gray-200 dark:bg-gray-800 pointer-events-none"
          />
          {childList ? (
            childList.map((child) => (
              <NavItem
                key={child.id}
                id={child.id}
                label={child.label}
                icon={child.icon}
                badge={child.badge}
                badgeVariant={child.badgeVariant}
                badgeColor={child.badgeColor}
                selected={child.selected}
                disabled={child.disabled}
                level={level + 1}
                size={child.size || effectiveSize}
                href={child.href}
                onClick={child.onClick || onClick}
                nestedItems={child.children}
              />
            ))
          ) : (
            <div className="w-full flex flex-col">{children as React.ReactNode}</div>
          )}
        </div>
      )}
    </div>
  );

  if (href && !disabled) {
    return (
      <a href={href} className="block w-full no-underline">
        {itemContent}
      </a>
    );
  }

  return itemContent;
}

// ============================================================================
// NAV GROUP COMPONENT
// ============================================================================

export function NavGroup({
  label,
  expanded = true,
  hideChevron = false,
  badge = false,
  children,
  onToggle,
  size,
  isFirstGroup = false,
  className = "",
  style,
}: NavGroupProps) {
  const context = useNavigationRail();
  const effectiveSize = size || context.size || "md";
  const isCollapsed = context.mode === "collapsed";

  const [internalExpanded, setInternalExpanded] = React.useState(expanded);
  const isExpandedState = onToggle !== undefined ? expanded : internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  // In collapsed mode: group headers and dividers are hidden
  if (isCollapsed) {
    return <div className={`flex flex-col gap-1 w-full ${className}`}>{children}</div>;
  }

  const heightClass = effectiveSize === "sm" ? "h-7" : "h-8";

  return (
    <div className={`flex flex-col w-full ${className}`} style={style}>
      {!isFirstGroup && (
        <div
          aria-hidden="true"
          className="my-2 border-t border-gray-200 dark:border-gray-800"
        />
      )}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpandedState}
        aria-label={`Toggle ${label} group`}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        className={`w-full ${heightClass} px-2 rounded-md flex items-center justify-between cursor-pointer select-none text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider truncate">
            {label}
          </span>
          {badge && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-brand shrink-0"
              aria-label="Badge indicator"
            />
          )}
        </div>
        {!hideChevron && (
          <span
            className={`transition-transform duration-200 shrink-0 ${
              isExpandedState ? "rotate-180" : "rotate-0"
            }`}
          >
            <ChevronDownIcon className="w-4 h-4" />
          </span>
        )}
      </div>

      {isExpandedState && (
        <div className="flex flex-col gap-0.5 mt-1 w-full">{children}</div>
      )}
    </div>
  );
}

// ============================================================================
// NAVIGATION RAIL ROOT COMPONENT
// ============================================================================

export function NavigationRail({
  mode = "expanded",
  header,
  children,
  footer,
  expandedWidth = 280,
  height = "100%",
  floating = false,
  showFooterDivider = true,
  className = "",
  style,
}: NavigationRailProps) {
  const isCollapsed = mode === "collapsed";
  const railWidth = isCollapsed ? 64 : expandedWidth;

  const contextValue = React.useMemo<NavigationRailContextValue>(
    () => ({
      mode,
      size: "md",
    }),
    [mode]
  );

  return (
    <NavigationRailContext.Provider value={contextValue}>
      <nav
        aria-label="Navigation Rail"
        data-mode={mode}
        className={`phx-navigation-rail flex flex-col shrink-0 bg-white dark:bg-gray-900 transition-[width] duration-300 ease-in-out select-none relative ${
          floating
            ? "border  dark:border-gray-800 rounded-xl shadow-md my-2 ml-2"
            : "dark:border-gray-800"
        } ${className}`}
        style={{
          width: railWidth,
          height: height,
          ...style,
        }}
      >
        {/* Header Slot */}
        {header && (
          <div
            className={`shrink-0 flex flex-col transition-all duration-300 ${
              isCollapsed ? "p-2 items-center" : "p-3"
            }`}
          >
            {header}
          </div>
        )}

        {/* Scrollable Center Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
            {children}
          </div>
        </div>

        {/* Footer Slot */}
        {footer && (
          <div
            className={`shrink-0 flex flex-col transition-all duration-300 ${
              showFooterDivider ? "border-t border-gray-200 dark:border-gray-800" : ""
            } ${isCollapsed ? "p-2 items-center" : "p-3"}`}
          >
            {footer}
          </div>
        )}
      </nav>
    </NavigationRailContext.Provider>
  );
}

// Alias export for consistency
export { NavigationRail as Rail };
