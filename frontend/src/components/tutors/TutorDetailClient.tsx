"use client";
import Link from "next/link";
import { useState } from "react";
import { HireTutorDialog } from "./HireTutorDialog";
import { useQuery } from "@tanstack/react-query";
import { getTutorById, publicAvatarUrl } from "@/lib/api/tutors";
import { ApiError } from "@/lib/api/http";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
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
  const query = useQuery({
    queryKey: ["public-tutor-detail", profileId],
    queryFn: ({ signal }) => getTutorById(profileId, signal),
    meta: { public: true },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
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
        <div className="space-y-4">
          {back}
          <p role="status">Đang tải hồ sơ gia sư...</p>
        </div>
      );
    if (query.isError)
      return (
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
      );
    const p = query.data;
    return (
      <div className="space-y-6 text-content-primary">
        <div className="flex flex-wrap gap-3">
          {back}
          <Button variant="brand" onClick={() => setHireOpen(true)}>
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
            <h1 className="text-2xl font-bold">{p.displayName}</h1>
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
    </>
  );
}
