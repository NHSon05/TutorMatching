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
import { busyInSlot } from "@/lib/hiring/busy-windows";
import { IconButton } from "@/components/ui/icon-button";
import {
  BookOpenIcon,
  BookmarkIcon,
  HeartIcon,
  ShareIcon,
} from "@/components/icons";
import { useAuthStore } from "@/stores/use-auth-store";
import { useSavedTutor } from "@/hooks/use-saved-tutor";
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
  const viewer = useAuthStore((state) => state.user);
  // Bookmarks are a learner feature; other signed-in roles do not see the button.
  const canSave =
    isAuthenticated && (!viewer?.role || viewer.role === "LEARNER");
  const saved = useSavedTutor(profileId, viewer?.id, canSave && !!viewer?.id);
  const [shareNote, setShareNote] = useState<string>();
  const handleSaveClick = () => {
    if (!isAuthenticated) {
      setLoginAlertOpen(true);
      return;
    }
    saved.toggle.mutate(!saved.isSaved);
  };
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareNote("Đã sao chép liên kết hồ sơ.");
    } catch {
      setShareNote(undefined);
    }
  };
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
      <Link href="/tutors">Quay lại</Link>
    </Button>
  );
  const renderContent = () => {
    if (query.isPending)
      return (
        <div className="mx-auto w-full max-w-[1776px] space-y-4">
          {back}
          <p role="status">Đang tải hồ sơ gia sư...</p>
        </div>
      );
    if (query.isError)
      return (
        <div className="mx-auto w-full max-w-[1776px]">
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
              <Button onClick={() => void query.refetch()}>
                Thử lại hồ sơ
              </Button>
            </div>
          </Card>
        </div>
      );
    const p = query.data;
    const hasRating = (p.reviewCount ?? 0) > 0 && p.averageRating != null;
    const sidePanel = (
      <Card className="space-y-5 lg:sticky lg:top-24">
        <p className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-content-primary">
            {p.sessionRateVnd.toLocaleString("vi-VN")}đ
          </span>
          <span className="text-content-secondary">/ buổi học</span>
        </p>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="sr-only">Đánh giá</dt>
            <dd className="text-2xl font-bold text-content-primary">
              {hasRating ? (
                <>
                  <span aria-hidden="true" className="text-status-warning">
                    ★
                  </span>{" "}
                  {Number(p.averageRating).toFixed(1)}
                </>
              ) : (
                "—"
              )}
            </dd>
            <dd className="text-sm text-content-secondary">
              {hasRating ? `${p.reviewCount} đánh giá` : "Chưa có đánh giá"}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Kinh nghiệm</dt>
            <dd className="text-2xl font-bold text-content-primary">
              {p.experienceYears == null ? "—" : `${p.experienceYears} năm`}
            </dd>
            <dd className="text-sm text-content-secondary">kinh nghiệm</dd>
          </div>
        </dl>
        <Button
          variant="brand"
          size="large"
          isFullWidth
          onClick={handleHireClick}
        >
          Thuê gia sư
        </Button>
        <div className="grid grid-cols-2 gap-3">
          {canSave || !isAuthenticated ? (
            <IconButton
              variant="secondary"
              shape="rounded"
              className="w-full"
              aria-label={saved.isSaved ? "Bỏ lưu gia sư" : "Lưu gia sư"}
              aria-pressed={saved.isSaved}
              disabled={saved.isLoading || saved.toggle.isPending}
              icon={
                <HeartIcon
                  filled={saved.isSaved}
                  className={`h-5 w-5 ${saved.isSaved ? "text-status-error" : ""}`}
                />
              }
              onClick={handleSaveClick}
            />
          ) : (
            <span />
          )}
          <IconButton
            variant="secondary"
            shape="rounded"
            className="w-full"
            aria-label="Chia sẻ hồ sơ"
            icon={<ShareIcon className="h-5 w-5" />}
            onClick={() => void handleShare()}
          />
        </div>
        {saved.toggle.isError && (
          <p role="alert" className="text-sm text-status-error">
            Không lưu được gia sư. Vui lòng thử lại.
          </p>
        )}
        {shareNote && (
          <p role="status" className="text-sm text-status-success">
            {shareNote}
          </p>
        )}
        <div className="flex gap-3 rounded-xl border border-border-default bg-surface-muted p-4 text-sm">
          <span className="text-content-secondary">
            Học phí theo buổi; lịch học và giá cuối cùng được thống nhất khi gia
            sư chấp nhận yêu cầu thuê.
          </span>
        </div>
      </Card>
    );
    return (
      <div className="mx-auto w-full space-y-6 text-content-primary">
        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          <div className="lg:col-span-2">
            <Card padding="none" className="relative overflow-hidden">
              {/* Decorative cover: brand landscape fading into the card. */}
              <div className="relative h-40 sm:h-52" aria-hidden="true">
                <div className="absolute inset-0 bg-linear-to-br from-brand-700 via-brand-500 to-sky-300" />
                <svg
                  className="absolute inset-x-0 bottom-0 h-3/4 w-full text-brand-900/40"
                  viewBox="0 0 800 200"
                  preserveAspectRatio="none"
                >
                  <path
                    fill="currentColor"
                    d="M0 200V120l90-55 70 40 110-85 95 70 80-45 120 80 85-50 150 75v45z"
                  />
                  <path
                    className="text-brand-950/30"
                    fill="currentColor"
                    d="M0 200v-45l120-40 110 50 140-65 120 55 130-40 180 50v35z"
                  />
                </svg>
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-surface-card via-surface-card/70 to-transparent" />
              </div>
              {(canSave || !isAuthenticated) && (
                <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
                  <IconButton
                    variant="ghost"
                    shape="circle"
                    className="bg-white/70 text-content-primary shadow-sm backdrop-blur-sm hover:bg-white"
                    aria-label={saved.isSaved ? "Bỏ lưu gia sư" : "Lưu gia sư"}
                    aria-pressed={saved.isSaved}
                    disabled={saved.isLoading || saved.toggle.isPending}
                    icon={
                      <BookmarkIcon
                        filled={saved.isSaved}
                        className={`h-5 w-5 ${saved.isSaved ? "text-brand" : ""}`}
                      />
                    }
                    onClick={handleSaveClick}
                  />
                </div>
              )}
              <div className="relative -mt-16 space-y-4 px-5 pb-6 sm:-mt-20 sm:px-6">
                <Avatar
                  size="xlarge"
                  src={publicAvatarUrl(p.avatarUrl)}
                  alt={p.displayName}
                  fallbackText={p.displayName}
                  className="h-24! w-24! rounded-full bg-surface-card ring-4 ring-surface-card shadow-sm sm:h-28! sm:w-28!"
                />
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <h1 className="text-2xl font-bold text-content-primary">
                      {p.displayName}
                    </h1>
                    <p className="text-content-secondary">
                      {[p.qualification, p.schoolName ?? p.specialization]
                        .filter(Boolean)
                        .join(" · ") || "Gia sư"}
                    </p>
                  </div>
                  {p.subjects.length > 0 && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 text-sm font-semibold text-content-primary">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand">
                        <BookOpenIcon className="h-3.5 w-3.5" />
                      </span>
                      {p.subjects
                        .slice(0, 2)
                        .map((s) => s.name)
                        .join(" · ")}
                      {p.subjects.length > 2 && ` +${p.subjects.length - 2}`}
                    </span>
                  )}
                </div>
                <p className="text-sm text-content-secondary">
                  {p.teachingModes.map((m) => modes[m] ?? m).join(", ")}
                  {(p.provinceName || p.districtName) &&
                    ` · ${[p.districtName, p.provinceName].filter(Boolean).join(", ")}`}
                </p>
                <p className="whitespace-pre-wrap text-content-primary">
                  {p.bio ?? "Chưa cập nhật giới thiệu."}
                </p>
              </div>
            </Card>
          </div>
          <aside
            className="lg:col-start-3 lg:row-span-2 lg:row-start lg:self-stretch"
            aria-label="Học phí và thuê gia sư"
          >
            {sidePanel}
          </aside>
          <div className="space-y-6 lg:col-span-2">
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
                    {[p.schoolName, p.specialization]
                      .filter(Boolean)
                      .join(" · ") || "Chưa cập nhật"}
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
                Múi giờ Asia/Ho_Chi_Minh. Khung giờ đánh dấu &quot;Đã có
                lịch&quot; đã được học viên khác đặt.
              </p>
              {p.availability.length ? (
                <ul className="space-y-2">
                  {p.availability.map((s) => {
                    const booked = busyInSlot(s, p.busyWindows ?? []);
                    return (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <span>
                          {days[s.dayOfWeek - 1]} · {s.startTime}–{s.endTime}
                        </span>
                        {booked.map((b) => (
                          <Badge
                            key={b.startTime}
                            variant="warning"
                            appearance="subtitle"
                            size="small"
                          >
                            Đã có lịch {b.startTime}–{b.endTime}
                          </Badge>
                        ))}
                      </li>
                    );
                  })}
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
                    <li
                      key={c.id}
                      className="border-b border-border-default pb-4"
                    >
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
                        <p className="text-sm whitespace-pre-wrap">
                          {rev.comment}
                        </p>
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
        </div>
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
