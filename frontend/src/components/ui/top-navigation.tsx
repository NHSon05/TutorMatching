"use client";

import * as React from "react";
import Logo from "@assets/logo/Logo";

export type TopNavigationBehavior = "static" | "sticky" | "hide-on-scroll";

export interface TopNavigationProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Phần tử Logo tùy biến ở góc trái. Mặc định là Logo của nền tảng.
   */
  logo?: React.ReactNode;

  /**
   * Nội dung phần trung tâm (Thanh tìm kiếm SearchField, Tabs, Liên kết điều hướng, v.v.)
   */
  centerContent?: React.ReactNode;

  /**
   * Nội dung phần bên phải (IconButton thông báo, Cài đặt, Nút CTA, Avatar người dùng)
   */
  rightContent?: React.ReactNode;

  /**
   * Ẩn phần bên trái (khu vực logo). Hữu ích khi dùng kết hợp sidebar mở rộng.
   * @default false
   */
  hideLeftSection?: boolean;

  /**
   * Hiển thị đường kẻ phân cách phía dưới thanh điều hướng.
   * @default true
   */
  showDivider?: boolean;

  /**
   * Nếu true, chiều rộng khu vực logo bên trái sẽ tự động co giãn theo nội dung thay vì cố định 248px.
   * @default false
   */
  hugLogo?: boolean;

  /**
   * Hành vi điều hướng khi cuộn trang:
   * - 'static': Cố định bình thường theo luồng văn bản
   * - 'sticky': Luôn ghim ở đầu trang khi cuộn
   * - 'hide-on-scroll': Ẩn đi khi cuộn xuống và hiện lại ngay khi cuộn lên
   * @default 'static'
   */
  behavior?: TopNavigationBehavior;

  /**
   * Nếu true, thanh điều hướng sẽ có nền trong suốt (phù hợp đặt trên Hero banner)
   * @default false
   */
  transparent?: boolean;

  /**
   * Buộc hiển thị nền ngay cả khi đang ở chế độ transparent (ví dụ khi mở Menu/Dropdown)
   * @default false
   */
  forceBackground?: boolean;
}

const defaultPlatformLogo = (
  <div className="flex items-center gap-2.5 select-none">
    <Logo variant="gradient" className="w-8 h-8" />
    <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
      TutorMatch
    </span>
  </div>
);

export function TopNavigation({
  logo = defaultPlatformLogo,
  centerContent,
  rightContent,
  hideLeftSection = false,
  showDivider = true,
  hugLogo = false,
  behavior = "static",
  transparent = false,
  forceBackground = false,
  className = "",
  children,
  ...props
}: TopNavigationProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    if (behavior !== "hide-on-scroll") return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 64) {
        // Cuộn xuống -> Ẩn thanh top-nav
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Cuộn lên -> Hiển thị lại thanh top-nav
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [behavior]);

  // Vị trí ghim/cuộn
  const positionClasses = React.useMemo(() => {
    switch (behavior) {
      case "sticky":
        return "sticky top-0 z-40";
      case "hide-on-scroll":
        return `fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`;
      case "static":
      default:
        return "relative w-full";
    }
  }, [behavior, isVisible]);

  // Nền trong suốt hoặc nền trắng/tối chuẩn thiết kế
  const isBgTransparent = transparent && !forceBackground;
  const bgClasses = isBgTransparent
    ? "bg-transparent text-inherit"
    : "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md text-gray-900 dark:text-gray-100";

  // Đường phân cách
  const dividerClasses =
    showDivider && !isBgTransparent
      ? "border-b border-gray-200/80 dark:border-gray-800"
      : "";

  // Độ rộng vùng logo bên trái
  const leftWidthClass = hugLogo ? "w-auto shrink-0" : "w-[248px] shrink-0";

  return (
    <header
      className={`h-16 px-4 sm:px-6 transition-colors duration-200 ${positionClasses} ${bgClasses} ${dividerClasses} ${className}`}
      {...props}
    >
      <div className="h-full w-full mx-auto flex items-center justify-between gap-4">
        {/* ========================================================================= */}
        {/* LEFT SECTION (Logo / Brand / Workspace Switcher)                          */}
        {/* ========================================================================= */}
        {!hideLeftSection && (
          <div className={`flex items-center gap-3 ${leftWidthClass}`}>
            {logo}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CENTER SECTION (SearchField, Tabs, NavLinks, v.v.)                        */}
        {/* ========================================================================= */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-2">
          {centerContent}
          {children}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT SECTION (Action buttons, Notifications, Avatar)                     */}
        {/* ========================================================================= */}
        {rightContent && (
          <div className="flex items-center justify-end gap-2.5 shrink-0">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  );
}

// Alias TopBar để tương thích với tên gọi top-bar
export const TopBar = TopNavigation;
export type TopBarProps = TopNavigationProps;

export default TopNavigation;
