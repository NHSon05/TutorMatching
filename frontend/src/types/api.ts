/**
 * Cấu trúc lỗi RFC 7807 trả về từ Backend API
 */
export interface ApiProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

/**
 * Cấu trúc Response chuẩn bọc dữ liệu API
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * Tham số phân trang gửi lên API
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Cấu trúc kết quả phân trang
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
