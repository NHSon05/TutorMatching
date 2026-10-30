import type { BadgeVariant } from "@/components/ui/badge";

export const hireStatuses: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  PENDING: { label: "Chờ phản hồi", variant: "warning" },
  NEGOTIATING: { label: "Đang thương lượng", variant: "brand" },
  ACCEPTED: { label: "Đã chấp nhận", variant: "success" },
  REJECTED: { label: "Đã từ chối", variant: "error" },
  CANCELLED: { label: "Đã hủy", variant: "gray" },
  COMPLETED: { label: "Đã hoàn thành", variant: "success" },
};
