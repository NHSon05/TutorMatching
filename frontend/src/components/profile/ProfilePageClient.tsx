"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { resolveAvatarUrl } from "@/lib/api/profile";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { TutorProfessionalForm } from "@/components/profile/TutorProfessionalForm";

const tutorStatuses = {
  DRAFT: "Chưa hoàn tất hồ sơ",
  PENDING_REVIEW: "Đang chờ xét duyệt",
  APPROVED: "Hồ sơ đã được duyệt",
  REJECTED: "Cần bổ sung hồ sơ",
};

export function ProfilePageClient() {
  const router = useRouter();
  const { data: account, isPending, error, refetch } = useSession();
  useEffect(() => {
    if (isPending || error) return;
    if (!account) router.replace("/login");
    else if (account.role === "ADMIN") router.replace("/forbidden");
  }, [account, error, isPending, router]);

  if (isPending) return <Card><p role="status">Đang tải hồ sơ của bạn...</p></Card>;
  if (error) return <Card><p role="alert" className="mb-4 text-status-error">Không thể tải thông tin cá nhân. Vui lòng kiểm tra kết nối.</p><Button variant="secondary" onClick={() => void refetch()}>Thử lại</Button></Card>;
  if (!account || account.role === "ADMIN") return null;
  const tutor = account.role === "TUTOR";
  const accent = tutor ? "text-role-tutor" : "text-brand";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 text-content-primary">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Hồ sơ của tôi</h1>
        <p className="text-sm text-content-secondary">{tutor ? "Giới thiệu chuyên môn của bạn và giữ thông tin liên hệ luôn chính xác." : "Một hồ sơ đầy đủ giúp hành trình học tập của bạn thuận tiện hơn."}</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card padding="none" className="overflow-hidden">
            <div className={`h-20 ${tutor ? "bg-tutor-100" : "bg-brand-100"}`} />
            <div className="space-y-4 px-5 pb-6">
              <Avatar key={account.avatarUrl ?? "initials"} src={resolveAvatarUrl(account.avatarUrl)} alt={account.fullName} fallbackText={account.fullName} size="xlarge" className="-mt-8 rounded-full ring-4 ring-surface-card" />
              <div className="space-y-2">
                <h2 className="wrap-break-word text-lg font-bold">{account.fullName}</h2>
                <Badge variant={tutor ? "tutor" : "brand"}>{tutor ? "Gia sư" : "Học viên"}</Badge>
                <p className="break-all text-xs text-content-secondary">{account.email}</p>
              </div>
              <div className="space-y-2 border-t border-border-default pt-4 text-xs">
                <p className="text-content-secondary">Trạng thái tài khoản</p>
                <Badge variant="success" dot>Đang hoạt động</Badge>
                {tutor && account.tutorProfileStatus && <p className={accent}>{tutorStatuses[account.tutorProfileStatus]}</p>}
              </div>
            </div>
          </Card>
          <Card padding="small">
            <h2 className="mb-2 text-sm font-semibold">Bạn kiểm soát thông tin của mình</h2>
            <p className="text-xs leading-5 text-content-secondary">Email, số điện thoại và ngày sinh không hiển thị trên hồ sơ công khai. Chỉ bạn mới có thể cập nhật thông tin cá nhân tại đây.</p>
          </Card>
          <Link href={tutor ? "/tutor/dashboard" : "/"} className={`inline-flex text-sm font-semibold ${accent}`}>← Quay về tổng quan</Link>
        </aside>

        <div className="min-w-0 space-y-6">
          <ProfileForm key={account.id} account={account} />
          {tutor ? <TutorProfessionalForm key={account.id} accountId={account.id} /> : (
            <Card>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">Mục tiêu học tập</h2>
                <Badge variant="warning">Dữ liệu mẫu</Badge>
              </div>
              <p className="mb-5 text-sm text-content-secondary">Minh họa cho hồ sơ học viên. Chưa có API lưu mục tiêu học tập; đây không phải dữ liệu cá nhân của bạn.</p>
              <dl className="grid gap-5 rounded-xl bg-brand-50 p-5 sm:grid-cols-2">
                <div><dt className="mb-1 text-xs text-content-secondary">Môn học quan tâm · mẫu</dt><dd className="text-sm font-semibold">Toán, Tiếng Anh</dd></div>
                <div><dt className="mb-1 text-xs text-content-secondary">Mục tiêu · mẫu</dt><dd className="text-sm font-semibold">Củng cố kiến thức nền tảng</dd></div>
                <div><dt className="mb-1 text-xs text-content-secondary">Hình thức học · mẫu</dt><dd className="text-sm font-semibold">Học trực tiếp, 1 kèm 1</dd></div>
                <div><dt className="mb-1 text-xs text-content-secondary">Lịch mong muốn · mẫu</dt><dd className="text-sm font-semibold">Buổi tối trong tuần</dd></div>
              </dl>
              <Link href="/tutors" className="mt-5 inline-flex text-sm font-semibold text-brand">Khám phá gia sư phù hợp →</Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
