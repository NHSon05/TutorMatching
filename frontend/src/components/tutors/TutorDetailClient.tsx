"use client";
import Link from "next/link";
import { useState } from "react";
import { HireTutorDialog } from "./HireTutorDialog";
import {
  LoginRequiredDialog,
  useIsViewerAuthenticated,
} from "./LoginRequiredDialog";
import { useQuery } from "@tanstack/react-query";
import {
  getTutorById,
  getTutorReviews,
  publicAvatarUrl,
} from "@/lib/api/tutors";
import { ApiError } from "@/lib/api/http";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatVietnamDateTime } from "@/lib/date-time";
const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const modes: Record<string, string> = {
  ONLINE: "Trực tuyến",
  OFFLINE: "Trực tiếp",
  HYBRID: "Kết hợp",
};
export default function TutorDetailClient({
  profileId,
}: {
  profileId: string;
}) {
  const [hireOpen, setHireOpen] = useState(false);
  const [loginAlertOpen, setLoginAlertOpen] = useState(false);
  const isAuthenticated = useIsViewerAuthenticated();
  const handleHireClick = () => {
    if (!isAuthenticated) {
      setLoginAlertOpen(true);
      return;
    }
    setHireOpen(true);
  };
  const query = useQuery({
    queryKey: ["public-tutor-detail", profileId],
    queryFn: ({ signal }) => getTutorById(profileId, signal),
    meta: { public: true },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: false,
  });
  const reviewsQuery = useQuery({
    queryKey: ["public-tutor-reviews", profileId],
    queryFn: ({ signal }) => getTutorReviews(profileId, 20, signal),
    enabled: (query.data?.reviewCount ?? 0) > 0,
    meta: { public: true },
    staleTime: 0,
    retry: false,
  });
  const back = (
    <Button asChild variant="secondary">
      <Link href="/tutors">Quay lại tìm gia sư</Link>
    </Button>
  );
  const renderContent = () => {
    if (query.isPending)
      return (
        <div className="mx-auto w-full max-w-7xl space-y-4">
          {back}
          <p role="status">Đang tải hồ sơ gia sư...</p>
        </div>
      );
    if (query.isError)
      return (
        <div className="mx-auto w-full max-w-7xl">
          <Card className="space-y-4">
            <h1 className="text-xl font-bold">
              {query.error instanceof ApiError && query.error.status === 404
                ? "Hồ sơ gia sư không còn khả dụng"
                : "Không thể tải hồ sơ gia sư"}
            </h1>
            <p role="alert">
              {query.error instanceof ApiError && query.error.status === 404
                ? "Hồ sơ hiện không được công khai. Hãy tìm gia sư khác."
                : "Vui lòng thử lại sau."}
            </p>
            <div className="flex flex-wrap gap-3">
              {back}
              <Button onClick={() => void query.refetch()}>Thử lại hồ sơ</Button>
            </div>
          </Card>
        </div>
      );
    const p = query.data;
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 text-content-primary">
        <div className="flex flex-wrap gap-3">
          {back}
          <Button variant="brand" onClick={handleHireClick}>
            Thuê gia sư
          </Button>
          <Button variant="secondary" onClick={() => void query.refetch()}>
            Kiểm tra lại hồ sơ
          </Button>
        </div>
        <Card className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar
              size="xlarge"
              src={publicAvatarUrl(p.avatarUrl)}
              alt={p.displayName}
              fallbackText={p.displayName}
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">{p.displayName}</h1>
              {(p.reviewCount ?? 0) > 0 && p.averageRating != null && (
                <div className="flex items-center gap-2">
                  <Badge variant="warning" appearance="solid" shape="pill">
                    {`★ ${Number(p.averageRating).toFixed(1)}`}
                  </Badge>
                  <span className="text-sm text-content-secondary">
                    {`${p.reviewCount} đánh giá từ học viên`}
                  </span>
                </div>
              )}
            </div>
          </div>
          <p className="text-lg font-semibold">
            {p.sessionRateVnd.toLocaleString("vi-VN")} VNĐ/buổi
          </p>
          <p>{p.teachingModes.map((m) => modes[m] ?? m).join(", ")}</p>
          {(p.provinceName || p.districtName) && (
            <p>{[p.districtName, p.provinceName].filter(Boolean).join(", ")}</p>
          )}
          <p className="whitespace-pre-wrap">
            {p.bio ?? "Chưa cập nhật giới thiệu."}
          </p>
        </Card>
        <Card className="space-y-3">
          <h2 className="text-xl font-bold">Chuyên môn và kinh nghiệm</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="font-semibold">Bằng cấp</dt>
              <dd>{p.qualification ?? "Chưa cập nhật"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Trường / chuyên ngành</dt>
              <dd>
                {[p.schoolName, p.specialization].filter(Boolean).join(" · ") ||
                  "Chưa cập nhật"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Kinh nghiệm</dt>
              <dd>
                {p.experienceYears == null
                  ? "Chưa cập nhật"
                  : `${p.experienceYears} năm`}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Phương pháp giảng dạy</dt>
              <dd className="whitespace-pre-wrap">
                {p.teachingMethodology ?? "Chưa cập nhật"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Thành tích</dt>
              <dd className="whitespace-pre-wrap">
                {p.achievements ?? "Chưa cập nhật"}
              </dd>
            </div>
          </dl>
        </Card>
        <Card className="space-y-3">
          <h2 className="text-xl font-bold">Môn học và cấp học</h2>
          {p.subjects.length ? (
            <ul className="space-y-2">
              {p.subjects.map((s) => (
                <li key={s.subjectId}>
                  <span className="font-semibold">{s.name}</span>:{" "}
                  {s.levelNames.join(", ") || "Chưa cập nhật cấp học"}
                </li>
              ))}
            </ul>
          ) : (
            <p>Chưa có môn học đang sử dụng.</p>
          )}
        </Card>
        <Card className="space-y-3">
          <h2 className="text-xl font-bold">Lịch rảnh hằng tuần</h2>
          <p className="text-sm text-content-secondary">
            Múi giờ Asia/Ho_Chi_Minh. Đây là lịch đã khai báo, chưa trừ lịch học
            đã chốt.
          </p>
          {p.availability.length ? (
            <ul className="space-y-2">
              {p.availability.map((s) => (
                <li key={s.id}>
                  {days[s.dayOfWeek - 1]} · {s.startTime}–{s.endTime}
                </li>
              ))}
            </ul>
          ) : (
            <p>Gia sư chưa có lịch rảnh công khai.</p>
          )}
        </Card>
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Khóa học đang mở</h2>
          {p.courses.length ? (
            <ul className="space-y-4">
              {p.courses.map((c) => (
                <li key={c.id} className="border-b border-border-default pb-4">
                  <h3 className="font-semibold">{c.name}</h3>
                  <p>
                    {c.subjectName} · {c.sessionCount} buổi ·{" "}
                    {c.pricePerSessionVnd.toLocaleString("vi-VN")} VNĐ/buổi
                  </p>
                  <p className="whitespace-pre-wrap">{c.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>Gia sư chưa có khóa học đang mở.</p>
          )}
        </Card>
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold">Đánh giá từ học viên</h2>
            {(p.reviewCount ?? 0) > 0 && p.averageRating != null && (
              <Badge variant="warning" appearance="solid" shape="pill">
                {`${Number(p.averageRating).toFixed(1)} / 5 ★ (${p.reviewCount} đánh giá)`}
              </Badge>
            )}
          </div>
          {(p.reviewCount ?? 0) === 0 ? (
            <p className="text-sm text-content-secondary">
              Chưa có đánh giá nào cho gia sư này.
            </p>
          ) : reviewsQuery.isPending ? (
            <p className="text-sm text-content-secondary">
              Đang tải đánh giá...
            </p>
          ) : reviewsQuery.data?.items.length ? (
            <ul className="space-y-4">
              {reviewsQuery.data.items.map((rev) => (
                <li
                  key={rev.id}
                  className="p-4 rounded-xl border border-border-default bg-surface-card space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm">
                      {rev.reviewerName}
                      {rev.subjectName ? ` • ${rev.subjectName}` : ""}
                    </div>
                    <Badge variant="warning" size="small" shape="pill">
                      {`${rev.rating} / 5 ★`}
                    </Badge>
                  </div>
                  {rev.comment && (
                    <p className="text-sm whitespace-pre-wrap">{rev.comment}</p>
                  )}
                  <p className="text-xs text-content-muted">
                    {formatVietnamDateTime(rev.createdAt)}
                  </p>
                  {rev.tutorReply && (
                    <div className="mt-2 p-3 rounded-lg bg-gray-50 border border-border-default space-y-1">
                      <p className="text-xs font-semibold text-brand">
                        Phản hồi từ gia sư:
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {rev.tutorReply}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-content-secondary">
              Chưa có đánh giá nào hiển thị.
            </p>
          )}
        </Card>
      </div>
    );
  };
  return (
    <>
      {renderContent()}
      <HireTutorDialog
        isOpen={hireOpen}
        onClose={() => setHireOpen(false)}
        tutorId={profileId}
      />
      <LoginRequiredDialog
        isOpen={loginAlertOpen}
        onClose={() => setLoginAlertOpen(false)}
      />
    </>
  );
}
