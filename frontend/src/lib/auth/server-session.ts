/**
 * Trích xuất vai trò người dùng (LEARNER, TUTOR, ADMIN) ở Server-Side (SSR / Next.js Server Components).
 *
 * Hàm này đọc từ request cookies:
 * 1. Payload của JWT HttpOnly `accessToken` (không verify secret mà chỉ đọc claim role làm UI hint)
 * 2. Cookie `tm_role` (UI hint được client đồng bộ khi đăng nhập/đăng xuất)
 *
 * Giúp Server Components biết trước vai trò của người dùng để render đúng Shell/Dashboard ngay từ HTML đầu tiên,
 * loại bỏ hoàn toàn tình trạng FOUC (flash landing page trước khi nhảy sang dashboard) khi F5/reload trang.
 */
export async function getServerSessionRole(): Promise<string | null> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();

    // 1. Kiểm tra JWT HttpOnly accessToken cookie
    const token = cookieStore.get("accessToken")?.value;
    if (token) {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
        const payload = JSON.parse(payloadJson);
        if (payload?.role && typeof payload.role === "string") {
          return payload.role;
        }
      }
    }

    // 2. Kiểm tra UI role hint cookie (tm_role)
    const roleHint = cookieStore.get("tm_role")?.value;
    if (roleHint) {
      return roleHint;
    }

    return null;
  } catch {
    return null;
  }
}
