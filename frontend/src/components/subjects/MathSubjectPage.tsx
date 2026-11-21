"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getTutors } from "@/lib/api/tutors";
import { findSubjectByName, usePublicSubjects } from "@/hooks/use-public-subjects";
import TutorCard from "@/components/tutors/TutorCard";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRightIcon,
  AwardIcon,
  BookOpenIcon,
  CheckCircleIcon,
  GraduationCapIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
} from "@/components/icons";

const FEATURED_TUTOR_COUNT = 4;

const LEVEL_TRACKS = [
  {
    levelCode: "PRIMARY",
    title: "Tiểu học",
    focus: "Toán tư duy & nền tảng",
    points: ["Phát triển tư duy logic qua trò chơi", "Thành thạo 4 phép tính, giải toán có lời văn", "Ôn thi học sinh giỏi, Violympic"],
    icon: <GraduationCapIcon className="w-6 h-6 text-status-success" />,
  },
  {
    levelCode: "SECONDARY",
    title: "THCS",
    focus: "Lấp lỗ hổng & thi vào 10",
    points: ["Đại số, hình học theo chương trình mới", "Xóa mất gốc, củng cố từng chuyên đề", "Luyện đề thi vào 10 công lập & chuyên"],
    icon: <GraduationCapIcon className="w-6 h-6 text-brand" />,
  },
  {
    levelCode: "HIGH_SCHOOL",
    title: "THPT",
    focus: "Luyện thi THPT & ĐGNL",
    points: ["Hàm số, tích phân, hình học không gian", "Chiến thuật làm bài trắc nghiệm nhanh", "Luyện đề THPT Quốc gia, ĐGNL, ĐGTD"],
    icon: <GraduationCapIcon className="w-6 h-6 text-status-error" />,
  },
  {
    levelCode: "UNIVERSITY",
    title: "Đại học",
    focus: "Toán cao cấp & XSTK",
    points: ["Giải tích, đại số tuyến tính", "Xác suất thống kê, toán rời rạc", "Ôn thi cuối kỳ, qua môn chắc chắn"],
    icon: <GraduationCapIcon className="w-6 h-6 text-status-warning" />,
  },
];

const BENEFITS = [
  {
    title: "Gia sư được xét duyệt",
    description: "Hồ sơ, bằng cấp và kinh nghiệm của từng gia sư đều được đội ngũ Edora kiểm tra trước khi hiển thị.",
    icon: <ShieldCheckIcon className="w-6 h-6 text-brand" />,
  },
  {
    title: "Lộ trình cá nhân hóa",
    description: "Gia sư đánh giá năng lực đầu vào và thiết kế lộ trình riêng theo mục tiêu điểm số của học viên.",
    icon: <TrendingUpIcon className="w-6 h-6 text-brand" />,
  },
  {
    title: "Học 1 kèm 1 linh hoạt",
    description: "Chọn học trực tuyến hoặc tại nhà, chủ động khung giờ phù hợp với lịch học trên trường.",
    icon: <UsersIcon className="w-6 h-6 text-brand" />,
  },
  {
    title: "Theo dõi tiến bộ rõ ràng",
    description: "Lịch học, nhận xét sau buổi và đánh giá giúp phụ huynh nắm được tiến độ của con.",
    icon: <AwardIcon className="w-6 h-6 text-brand" />,
  },
];

const STEPS = [
  { title: "Chọn gia sư", description: "Lọc theo cấp học, khu vực, học phí và xem đánh giá thực tế." },
  { title: "Gửi yêu cầu", description: "Chọn lịch học mong muốn và gửi yêu cầu thuê gia sư." },
  { title: "Bắt đầu học", description: "Gia sư xác nhận, hai bên bắt đầu buổi học đầu tiên." },
];

const FAQ = [
  {
    id: "price",
    title: "Học phí gia sư Toán khoảng bao nhiêu?",
    body: "Mỗi gia sư tự đặt học phí theo buổi, tùy cấp học và kinh nghiệm. Bạn có thể lọc theo khoảng giá ở trang tìm gia sư.",
  },
  {
    id: "online",
    title: "Có thể học Toán trực tuyến không?",
    body: "Có. Nhiều gia sư hỗ trợ dạy trực tuyến, trực tiếp hoặc kết hợp; hình thức được ghi rõ trên hồ sơ từng gia sư.",
  },
  {
    id: "change",
    title: "Nếu chưa phù hợp, tôi có đổi gia sư được không?",
    body: "Được. Bạn có thể tìm và gửi yêu cầu cho gia sư khác bất cứ lúc nào để chọn người phù hợp nhất.",
  },
  {
    id: "exam",
    title: "Gia sư có hỗ trợ luyện thi vào 10 và THPT Quốc gia không?",
    body: "Có. Chọn cấp THCS hoặc THPT để xem các gia sư có kinh nghiệm luyện thi tương ứng.",
  },
];

const linkButton =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 h-12 text-base font-semibold transition-colors";

export function MathSubjectPage() {
  const subjects = usePublicSubjects();
  const math = findSubjectByName(subjects.data, "toán học");
  const tutorsHref = (levelCode?: string) => {
    const query = new URLSearchParams();
    if (math) query.set("subjectId", math.code);
    if (levelCode) query.set("levelCode", levelCode);
    const text = query.toString();
    return text ? `/tutors?${text}` : "/tutors";
  };

  const tutors = useQuery({
    queryKey: ["public-tutor-search", "subject-page", math?.code],
    meta: { public: true },
    enabled: Boolean(math),
    queryFn: ({ signal }) =>
      getTutors({ subjectId: [math!.code], page: 1, pageSize: FEATURED_TUTOR_COUNT }, signal),
  });

  const catalogMissing = subjects.isSuccess && !math;
  const loadingTutors = subjects.isPending || (Boolean(math) && tutors.isPending);
  const ratings = tutors.data?.items.filter((tutor) => (tutor.reviewCount ?? 0) > 0) ?? [];
  const averageRating = ratings.length
    ? ratings.reduce((sum, tutor) => sum + (tutor.averageRating ?? 0), 0) / ratings.length
    : null;

  return (
    <div className="pt-20 space-y-16 sm:space-y-20 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[32px] bg-linear-to-br from-brand-50 via-surface-card to-surface-base border border-border-default px-6 py-10 sm:px-12 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <Badge variant="brand" appearance="subtitle" shape="pill" icon={<SparklesIcon className="w-3.5 h-3.5" />}>
              Môn Toán
            </Badge>
            <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-content-primary leading-tight">
              Gia sư Toán 1 kèm 1 — vững nền tảng, bứt phá điểm số
            </h1>
            <p className="mt-4 text-base sm:text-lg text-content-secondary max-w-2xl">
              Kết nối với gia sư Toán đã được xét duyệt cho mọi cấp học: từ Toán tư duy tiểu học, ôn thi vào 10,
              luyện thi THPT Quốc gia đến Toán cao cấp đại học.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href={tutorsHref()} className={`${linkButton} bg-brand text-white hover:bg-brand-700`}>
                Xem tất cả gia sư Toán
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                href="#lo-trinh"
                className={`${linkButton} border border-border-default bg-surface-card text-content-primary hover:bg-gray-50`}
              >
                Xem lộ trình theo cấp học
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            <Stat label="Gia sư Toán" value={tutors.data ? `${tutors.data.totalCount}` : loadingTutors ? null : "—"} />
            <Stat label="Đánh giá nổi bật" value={averageRating ? `${averageRating.toFixed(1)}★` : loadingTutors ? null : "—"} />
            <Stat label="Cấp học" value="4" />
            <Stat label="Hình thức" value="Online / Tại nhà" small />
          </dl>
        </div>
      </section>

      {/* Level tracks */}
      <section id="lo-trinh" className="scroll-mt-28">
        <SectionHeading
          eyebrow="Lộ trình"
          title="Học Toán theo từng cấp học"
          description="Chọn cấp học để xem các gia sư Toán phù hợp với mục tiêu của bạn."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEVEL_TRACKS.map((track) => (
            <Card key={track.levelCode} hoverable padding="medium" className="flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-surface-base flex items-center justify-center">{track.icon}</div>
              <h3 className="mt-4 text-xl font-bold text-content-primary">{track.title}</h3>
              <p className="text-sm font-semibold text-brand">{track.focus}</p>
              <ul className="mt-4 space-y-2 flex-1">
                {track.points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm text-content-secondary">
                    <CheckCircleIcon className="w-4 h-4 mt-0.5 shrink-0 text-status-success" />
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                href={tutorsHref(track.levelCode)}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
              >
                Tìm gia sư {track.title}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured tutors */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <SectionHeading
            eyebrow="Đội ngũ"
            title="Gia sư Toán nổi bật"
            description="Một số gia sư Toán mới được duyệt trên Edora."
          />
          <Link href={tutorsHref()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline shrink-0">
            Xem tất cả
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          {loadingTutors &&
            Array.from({ length: 2 }, (_, index) => <Skeleton key={index} height={220} />)}

          {(catalogMissing || subjects.isError || tutors.isError) && (
            <EmptyState
              message={
                catalogMissing
                  ? "Chưa có môn Toán trong danh mục. Bạn có thể xem tất cả gia sư hiện có."
                  : "Không tải được danh sách gia sư lúc này. Vui lòng thử lại sau."
              }
            />
          )}

          {tutors.data && tutors.data.items.length === 0 && (
            <EmptyState message="Hiện chưa có gia sư Toán nào được duyệt. Hãy quay lại sau nhé." />
          )}

          {tutors.data?.items.map((tutor) => <TutorCard key={tutor.id} tutor={tutor} />)}
        </div>
      </section>

      {/* Benefits */}
      <section>
        <SectionHeading eyebrow="Vì sao chọn Edora" title="Học Toán hiệu quả hơn với gia sư phù hợp" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="rounded-3xl border border-border-default bg-surface-card p-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center">{benefit.icon}</div>
              <h3 className="mt-4 text-lg font-bold text-content-primary">{benefit.title}</h3>
              <p className="mt-2 text-sm text-content-secondary leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <SectionHeading eyebrow="Bắt đầu" title="3 bước để học cùng gia sư Toán" />
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-3xl bg-surface-card border border-border-default p-6">
              <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-brand text-white font-bold">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold text-content-primary">{step.title}</h3>
              <p className="mt-2 text-sm text-content-secondary">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl">
        <SectionHeading eyebrow="Hỏi đáp" title="Câu hỏi thường gặp" />
        <Accordion
          className="mt-6"
          items={FAQ.map((item) => ({
            id: item.id,
            title: item.title,
            children: <p className="text-content-secondary">{item.body}</p>,
          }))}
        />
      </section>

      {/* CTA */}
      <section className="rounded-[32px] bg-brand px-6 py-10 sm:px-12 sm:py-12 text-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-start gap-4">
          <BookOpenIcon className="w-10 h-10 shrink-0 text-white" />
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Sẵn sàng chinh phục môn Toán?</h2>
            <p className="mt-2 text-white/80">Tìm gia sư phù hợp và gửi yêu cầu học ngay hôm nay.</p>
          </div>
        </div>
        <Link href={tutorsHref()} className={`${linkButton} bg-white text-brand hover:bg-brand-50 shrink-0`}>
          Tìm gia sư Toán
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-brand">{eyebrow}</p>
      <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-content-primary">{title}</h2>
      {description && <p className="mt-2 text-content-secondary">{description}</p>}
    </div>
  );
}

function Stat({ label, value, small = false }: { label: string; value: string | null; small?: boolean }) {
  return (
    <div className="rounded-3xl bg-surface-card border border-border-default p-5">
      <dt className="text-sm text-content-secondary">{label}</dt>
      <dd className={`mt-1 font-bold text-content-primary ${small ? "text-lg" : "text-3xl"}`}>
        {value ?? <Skeleton variant="text" width="60%" height={32} />}
      </dd>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border-default bg-surface-card p-8 text-center">
      <p className="text-content-secondary">{message}</p>
      <Link href="/tutors" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
        Xem tất cả gia sư
        <ArrowRightIcon className="w-4 h-4" />
      </Link>
    </div>
  );
}
