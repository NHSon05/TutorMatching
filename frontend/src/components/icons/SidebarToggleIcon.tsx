export function SidebarToggleIcon({
  collapsed,
  className = "w-5 h-5",
}: {
  collapsed: boolean;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
      {collapsed ? (
        <path d="m14 9 3 3-3 3" />
      ) : (
        <path d="m17 9-3 3 3 3" />
      )}
    </svg>
  );
}
