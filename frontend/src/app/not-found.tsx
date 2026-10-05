import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Không tìm thấy trang
      </h2>
      <p className="text-gray-600 max-w-md mb-8">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển đến địa chỉ khác.
      </p>
      <Button asChild variant="brand">
        <Link href="/">Về trang chủ</Link>
      </Button>
    </div>
  );
}
