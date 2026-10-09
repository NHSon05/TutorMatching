import Link from "next/link";

export default function ForbiddenPage() {
  return <main className="p-8 text-content-primary bg-surface-base">
    <h1>Bạn không có quyền truy cập trang này</h1>
    <Link href="/">Về trang chủ</Link>
  </main>;
}
