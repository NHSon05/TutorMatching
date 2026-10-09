/**
 * Cặp giá trị dùng cho Dropdown, Select, Radio, SegmentedControl
 */
export interface OptionItem<T = string> {
  value: T;
  label: string;
}

/**
 * Trạng thái thực thể chung
 */
export type Status = "ACTIVE" | "INACTIVE" | "PENDING" | "LOCKED";

/**
 * Kiểu dữ liệu hỗ trợ null
 */
export type Nullable<T> = T | null;

/**
 * Khoảng ngày (Dùng cho DateRangePicker)
 */
export interface DateRange {
  from?: Date;
  to?: Date;
}
