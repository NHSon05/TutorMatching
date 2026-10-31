"use client";

import * as React from "react";

export type TabRoleVariant = "brand" | "tutor" | "admin" | "shared";
export type TabVisualVariant = "line" | "pill";
export type TabSize = "small" | "medium" | "large";
export type TabOverflowControls = "auto" | "never";
export type TabActivationMode = "automatic" | "manual";

export interface TabOption {
  /**
   * Unique identifier for the tab.
   */
  id: string;
  /**
   * Text or node label for the tab.
   */
  label?: React.ReactNode;
  /**
   * Optional icon node (rendered before label or stacked on top).
   */
  icon?: React.ReactNode;
  /**
   * Optional badge count or status text.
   */
  badge?: React.ReactNode | string | number;
  /**
   * Whether the tab is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether to display a chevron icon indicating sub-menu or more actions.
   * @default false
   */
  showChevron?: boolean;
}

export interface TabsProps {
  /**
   * Array of tab items to display.
   */
  tabs: TabOption[];
  /**
   * Stable prefix shared with TabPanel; enables tab/panel ARIA linkage.
   */
  id?: string;
  /**
   * Currently active tab ID (controlled mode).
   */
  activeTab?: string;
  /**
   * Initial active tab ID for uncontrolled mode. Defaults to first non-disabled tab.
   */
  defaultTab?: string;
  /**
   * Callback fired when active tab changes.
   */
  onChange?: (tabId: string) => void;
  /**
   * Brand semantic color role:
   * - brand: Blue (Learner / Platform primary)
   * - tutor: Amber (Tutor workspace)
   * - admin: Crimson (Admin workspace)
   * - shared: Indigo (Negotiations / Messaging)
   * @default 'brand'
   */
  roleVariant?: TabRoleVariant;
  /**
   * Visual variant:
   * - line: Underline indicator with border bottom (standard Photonix tab style)
   * - pill: Segmented pill background highlight
   * @default 'line'
   */
  variant?: TabVisualVariant;
  /**
   * Sizing scale:
   * - small: Compact for dense tables/toolbars
   * - medium: Default size for cards and pages
   * - large: Prominent page-level headers
   * @default 'medium'
   */
  size?: TabSize;
  /**
   * Whether to stack icon on top of label (vertical item layout).
   * @default false
   */
  stacked?: boolean;
  /**
   * Whether tabs have elevated shadow and distinct background surface.
   * @default false
   */
  elevated?: boolean;
  /**
   * Whether tabs are sticky (position sticky top with backdrop blur).
   * @default false
   */
  sticky?: boolean;
  /**
   * Externally controlled stuck state styling.
   */
  stuck?: boolean;
  /**
   * Horizontal padding: boolean true defaults to 16px (px-4), or custom string/number.
   */
  padded?: boolean | string | number;
  /**
   * Whether horizontal overflow navigation buttons should appear automatically.
   * @default 'auto'
   */
  overflowControls?: TabOverflowControls;
  /**
   * Keyboard activation mode:
   * - automatic: Selection follows focus immediately
   * - manual: User must press Enter or Space to select after focusing
   * @default 'automatic'
   */
  activationMode?: TabActivationMode;
  /**
   * Optional custom CSS class.
   */
  className?: string;
  /**
   * Optional custom inline styles.
   */
  style?: React.CSSProperties;
  /**
   * Optional label displayed above the tabs.
   */
  label?: React.ReactNode;
  /**
   * Accessible ARIA label for the tablist.
   */
  "aria-label"?: string;
}

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Prefix matching the Tabs `id` prop for ARIA labelling.
   */
  tabsId?: string;
  /**
   * The tab ID that this panel corresponds to.
   */
  tabId: string;
  /**
   * The currently active tab ID. Panel renders only when activeTab === tabId.
   */
  activeTab?: string;
  /**
   * Panel content.
   */
  children?: React.ReactNode;
  /**
   * Optional custom CSS class.
   */
  className?: string;
}

const roleStyles: Record<
  TabRoleVariant,
  {
    lineActive: string;
    pillActive: string;
    indicator: string;
    badgeActive: string;
  }
> = {
  brand: {
    lineActive: "text-brand-600 dark:text-brand-400 font-semibold",
    pillActive: "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold shadow-2xs",
    indicator: "bg-brand-600 dark:bg-brand-400",
    badgeActive: "bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200",
  },
  tutor: {
    lineActive: "text-amber-600 dark:text-amber-400 font-semibold",
    pillActive: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold shadow-2xs",
    indicator: "bg-amber-600 dark:bg-amber-400",
    badgeActive: "bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200",
  },
  admin: {
    lineActive: "text-red-600 dark:text-red-400 font-semibold",
    pillActive: "bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 font-semibold shadow-2xs",
    indicator: "bg-red-600 dark:bg-red-400",
    badgeActive: "bg-red-100 text-red-900 dark:bg-red-900/60 dark:text-red-200",
  },
  shared: {
    lineActive: "text-indigo-600 dark:text-indigo-400 font-semibold",
    pillActive: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold shadow-2xs",
    indicator: "bg-indigo-600 dark:bg-indigo-400",
    badgeActive: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-200",
  },
};

const sizeStyles: Record<
  TabSize,
  {
    button: string;
    buttonStacked: string;
    icon: string;
    iconStacked: string;
    badge: string;
  }
> = {
  small: {
    button: "text-xs py-1.5 px-2.5 gap-1.5",
    buttonStacked: "text-xs py-1 px-2 gap-1",
    icon: "w-3.5 h-3.5",
    iconStacked: "w-4 h-4",
    badge: "text-[10px] px-1.5 py-0.2",
  },
  medium: {
    button: "text-base py-2.5 px-3.5 gap-2",
    buttonStacked: "text-xs py-2 px-3 gap-1",
    icon: "w-4 h-4",
    iconStacked: "w-5 h-5",
    badge: "text-xs px-2 py-0.5",
  },
  large: {
    button: "text-base py-3 px-4.5 gap-2.5",
    buttonStacked: "text-sm py-2.5 px-3.5 gap-1.5",
    icon: "w-5 h-5",
    iconStacked: "w-6 h-6",
    badge: "text-xs px-2.5 py-0.5",
  },
};

export function Tabs({
  tabs,
  id,
  activeTab: controlledActiveTab,
  defaultTab,
  onChange,
  roleVariant = "brand",
  variant = "line",
  size = "medium",
  stacked = false,
  elevated = false,
  sticky = false,
  stuck = false,
  padded = false,
  overflowControls = "auto",
  activationMode = "automatic",
  className = "",
  style,
  label,
  "aria-label": ariaLabel,
}: TabsProps) {
  const generatedId = React.useId();
  const baseId = id || generatedId;

  const isControlled = controlledActiveTab !== undefined;
  const initialTab =
    defaultTab !== undefined
      ? defaultTab
      : tabs.find((t) => !t.disabled)?.id ?? tabs[0]?.id ?? "";

  const [uncontrolledActiveTab, setUncontrolledActiveTab] =
    React.useState<string>(initialTab);
  const activeTabId = isControlled
    ? controlledActiveTab
    : uncontrolledActiveTab;

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());

  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  // Check scroll overflows
  const updateScrollState = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || overflowControls === "never") {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, [overflowControls]);

  React.useEffect(() => {
    updateScrollState();
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => updateScrollState();
    el.addEventListener("scroll", handleScroll, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateScrollState());
      resizeObserver.observe(el);
    }

    return () => {
      el.removeEventListener("scroll", handleScroll);
      resizeObserver?.disconnect();
    };
  }, [updateScrollState, tabs]);

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = direction === "left" ? -180 : 180;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  const handleTabChange = (tabId: string) => {
    if (!isControlled) {
      setUncontrolledActiveTab(tabId);
    }
    onChange?.(tabId);
  };

  // Keyboard navigation according to WAI-ARIA
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    const enabledTabs = tabs.filter((t) => !t.disabled);
    const enabledIndex = enabledTabs.findIndex(
      (t) => t.id === tabs[currentIndex]?.id
    );

    let nextTab: TabOption | undefined;

    switch (e.key) {
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        nextTab =
          enabledTabs[
            (enabledIndex - 1 + enabledTabs.length) % enabledTabs.length
          ];
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        nextTab = enabledTabs[(enabledIndex + 1) % enabledTabs.length];
        break;
      case "Home":
        e.preventDefault();
        nextTab = enabledTabs[0];
        break;
      case "End":
        e.preventDefault();
        nextTab = enabledTabs[enabledTabs.length - 1];
        break;
      case "Enter":
      case " ":
        if (activationMode === "manual") {
          e.preventDefault();
          handleTabChange(tabs[currentIndex].id);
        }
        return;
      default:
        return;
    }

    if (nextTab) {
      const buttonEl = tabRefs.current.get(nextTab.id);
      buttonEl?.focus();
      if (activationMode === "automatic") {
        handleTabChange(nextTab.id);
      }
    }
  };

  const currentRole = roleStyles[roleVariant] || roleStyles.brand;
  const currentSize = sizeStyles[size] || sizeStyles.medium;

  const paddingStyle =
    typeof padded === "boolean"
      ? padded
        ? "px-4"
        : ""
      : typeof padded === "number"
      ? `px-[${padded}px]`
      : "";

  const containerPaddingStyle: React.CSSProperties =
    typeof padded === "number"
      ? { paddingLeft: padded, paddingRight: padded }
      : typeof padded === "string"
      ? { paddingLeft: padded, paddingRight: padded }
      : {};

  return (
    <div
      className={`relative w-full ${
        sticky
          ? "sticky top-0 z-20 backdrop-blur-md bg-white/90 dark:bg-gray-900/90"
          : ""
      } ${
        elevated || stuck
          ? "bg-white dark:bg-gray-900 shadow-xs border-b border-border-default"
          : variant === "line"
          ? "border-b border-border-default"
          : ""
      } ${paddingStyle} ${className}`}
      style={{ ...containerPaddingStyle, ...style }}
    >
      {label && (
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {label}
        </div>
      )}
      <div className="relative flex items-center w-full">
        {/* Left Scroll Button */}
        {overflowControls === "auto" && canScrollLeft && (
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollByAmount("left")}
            className="absolute left-0 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-white/95 dark:bg-gray-800/95 text-content-secondary hover:text-content-primary shadow-xs border border-border-default cursor-pointer transition-all duration-150"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable Tabs Wrapper */}
        <div
          ref={scrollContainerRef}
          role="tablist"
          aria-orientation="horizontal"
          aria-label={ariaLabel || (typeof label === "string" ? label : undefined)}
          className={`flex items-center w-full overflow-x-auto scrollbar-none scroll-smooth ${
            variant === "pill" ? "p-1 gap-1" : "-mb-px gap-1"
          }`}
        >
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTabId;
            const isButtonDisabled = Boolean(tab.disabled);

            return (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.id, el);
                  else tabRefs.current.delete(tab.id);
                }}
                id={`${baseId}-tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`${baseId}-panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                disabled={isButtonDisabled}
                onClick={() => {
                  if (!isButtonDisabled) handleTabChange(tab.id);
                }}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`relative inline-flex items-center justify-center shrink-0 select-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                  stacked ? currentSize.buttonStacked : currentSize.button
                } ${
                  stacked
                    ? "flex-col text-center"
                    : "flex-row"
                } ${
                  variant === "pill"
                    ? `rounded-xl ${
                        isActive
                          ? currentRole.pillActive
                          : "text-content-secondary hover:text-content-primary hover:bg-gray-100 dark:hover:bg-gray-800/60"
                      }`
                    : `border-b-2 font-medium ${
                        isActive
                          ? `${currentRole.lineActive} border-current`
                          : "text-content-secondary hover:text-content-primary border-transparent hover:border-gray-300 dark:hover:border-gray-700"
                      }`
                } ${
                  isButtonDisabled
                    ? "opacity-40 cursor-not-allowed pointer-events-none"
                    : "cursor-pointer"
                }`}
              >
                {/* Icon */}
                {tab.icon && (
                  <span
                    className={`inline-flex shrink-0 items-center justify-center ${
                      stacked ? currentSize.iconStacked : currentSize.icon
                    }`}
                    aria-hidden="true"
                  >
                    {tab.icon}
                  </span>
                )}

                {/* Label */}
                {tab.label !== undefined && tab.label !== null && (
                  <span className="truncate">{tab.label}</span>
                )}

                {/* Optional Badge */}
                {tab.badge !== undefined && tab.badge !== null && (
                  <span
                    className={`inline-flex items-center justify-center rounded-full font-medium ${
                      currentSize.badge
                    } ${
                      isActive
                        ? currentRole.badgeActive
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}

                {/* Optional Chevron */}
                {tab.showChevron && (
                  <ChevronDownIcon
                    className="w-3.5 h-3.5 shrink-0 opacity-70"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        {overflowControls === "auto" && canScrollRight && (
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollByAmount("right")}
            className="absolute right-0 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-white/95 dark:bg-gray-800/95 text-content-secondary hover:text-content-primary shadow-xs border border-border-default cursor-pointer transition-all duration-150"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function TabPanel({
  tabsId,
  tabId,
  activeTab,
  children,
  className = "",
  ...props
}: TabPanelProps) {
  const isSelected = activeTab === tabId;

  if (!isSelected) return null;

  return (
    <div
      role="tabpanel"
      id={tabsId ? `${tabsId}-panel-${tabId}` : undefined}
      aria-labelledby={tabsId ? `${tabsId}-tab-${tabId}` : undefined}
      tabIndex={0}
      className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Inline lightweight SVGs to avoid extra external icon dependencies
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
