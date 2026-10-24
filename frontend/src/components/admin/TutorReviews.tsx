"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedAccount } from "@/hooks/use-authenticated-account";
import {
  getReviewQueue,
  getReviewDetail,
  decideReview,
  type ReviewAction,
  type ReviewDetail,
} from "@/lib/api/tutor-reviews";
import { ReviewHistoryList } from "@/components/tutors/ReviewHistoryList";
import { ApiError } from "@/lib/api/http";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextArea } from "@/components/ui/text-area";

export default function TutorReviews() {
  const account = useAuthenticatedAccount();
  return <TutorReviewsPanel key={account.id} accountId={account.id} />;
}
export function TutorReviewsPanel({ accountId }: { accountId: string }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string>();
  const query = useQuery({
    queryKey: ["tutor-reviews", accountId, page],
    queryFn: ({ signal }) => getReviewQueue(page, signal),
  });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Duyệt hồ sơ gia sư</h1>
        <p className="text-content-secondary">
          Xem nội dung hồ sơ trước khi đưa ra quyết định.
        </p>
      </header>
      {query.isPending ? (
        <p role="status">Đang tải hàng đợi...</p>
      ) : query.isError ? (
        <Card>
          <p role="alert">Không thể tải hàng đợi.</p>
          <Button onClick={() => void query.refetch()}>Thử lại hàng đợi</Button>
        </Card>
      ) : (
        <Card>
          <p>{query.data.totalCount} hồ sơ chờ duyệt</p>
          {query.data.items.length === 0 ? (
            <p>Không có hồ sơ chờ duyệt ở trang này.</p>
          ) : (
            <ul className="divide-y divide-border-default">
              {query.data.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div>
                    <p className="font-semibold">{item.displayName}</p>
                    {item.submittedAt && (
                      <time dateTime={item.submittedAt}>
                        {new Date(item.submittedAt).toLocaleString("vi-VN")}
                      </time>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setSelected(item.id)}
                  >
                    Xem hồ sơ {item.displayName}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <nav
            aria-label="Phân trang hàng đợi"
            className="mt-4 flex items-center gap-3"
          >
            <Button
              disabled={page === 1}
              onClick={() => {
                setPage(page - 1);
                setSelected(undefined);
              }}
            >
              Trang trước
            </Button>
            <span>Trang {page}</span>
            <Button
              disabled={page * 20 >= query.data.totalCount}
              onClick={() => {
                setPage(page + 1);
                setSelected(undefined);
              }}
            >
              Trang sau
            </Button>
          </nav>
        </Card>
      )}
      {selected && (
        <ReviewSelection
          key={selected}
          accountId={accountId}
          id={selected}
          onDone={() => setSelected(undefined)}
        />
      )}
    </div>
  );
}
function ReviewSelection({
  accountId,
  id,
  onDone,
}: {
  accountId: string;
  id: string;
  onDone: () => void;
}) {
  const query = useQuery({
    queryKey: ["tutor-review", accountId, id],
    queryFn: ({ signal }) => getReviewDetail(id, signal),
  });
  if (query.isPending) return <p role="status">Đang tải chi tiết...</p>;
  if (query.isError)
    return (
      <Card>
        <p role="alert">Không thể tải chi tiết hồ sơ.</p>
        <Button onClick={() => void query.refetch()}>Thử lại chi tiết</Button>
      </Card>
    );
  return (
    <ReviewDecision
      key={query.data.profile.version}
      detail={query.data}
      accountId={accountId}
      onDone={onDone}
      reload={() => void query.refetch()}
    />
  );
}
function ReviewDecision({
  detail,
  accountId,
  onDone,
  reload,
}: {
  detail: ReviewDetail;
  accountId: string;
  onDone: () => void;
  reload: () => void;
}) {
  const client = useQueryClient();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);
  const p = detail.profile;
  async function decide(action: ReviewAction) {
    if (busy || stale) return;
    if (action !== "APPROVE" && !note.trim()) {
      setError("Vui lòng nhập lý do yêu cầu sửa hoặc từ chối.");
      return;
    }
    if (!p.version) {
      setStale(true);
      setError("Thiếu phiên bản hồ sơ. Vui lòng tải lại.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await decideReview(detail.id, {
        expectedVersion: p.version,
        action,
        note: note.trim() || undefined,
      });
      await client.invalidateQueries({
        queryKey: ["tutor-reviews", accountId],
      });
      await client.invalidateQueries({
        queryKey: ["tutor-review", accountId, detail.id],
      });
      onDone();
    } catch (e) {
      const conflict = e instanceof ApiError && e.status === 409;
      setStale(conflict);
      setError(
        conflict
          ? "Hồ sơ đã thay đổi hoặc không còn chờ duyệt. Tải lại để xem phiên bản mới."
          : "Chưa thể lưu quyết định. Vui lòng thử lại."
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="space-y-5">
      <h2 className="text-xl font-bold">{p.about.fullName}</h2>
      <p>
        Trạng thái: {p.status} · Tài khoản: {detail.accountStatus}
      </p>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="font-semibold">Trình độ</dt>
          <dd>
            {[
              p.education.degree,
              p.education.schoolName,
              p.education.specialization,
            ]
              .filter(Boolean)
              .join(" · ") || "Chưa có"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Môn và trình độ dạy</dt>
          <dd>
            {detail.subjects?.length ? (
              <ul>
                {detail.subjects.map((subject) => (
                  <li key={subject.subjectId}>
                    {subject.name}: {subject.levels.join(", ")}
                  </li>
                ))}
              </ul>
            ) : (
              <span>
                {p.about.subjects?.join(", ")} ·{" "}
                {p.about.teachingLevels?.join(", ")}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Giá theo buổi</dt>
          <dd>
            {p.pricing.sessionRateVnd?.toLocaleString("vi-VN") ?? "Chưa có"} VNĐ
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Hình thức / khu vực</dt>
          <dd>
            {p.discovery?.teachingModes?.join(", ")} · {detail.provinceName}{" "}
            {detail.districtName}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Giới thiệu</dt>
          <dd className="whitespace-pre-wrap">{p.description.bio}</dd>
        </div>
        <div>
          <dt className="font-semibold">Kinh nghiệm</dt>
          <dd>
            {p.description.experienceYears} năm ·{" "}
            {p.description.teachingMethodology}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Thành tích</dt>
          <dd className="whitespace-pre-wrap">
            {p.description.achievementsAndResults}
          </dd>
        </div>
      </dl>
      <div>
        <h3 className="font-semibold">Chứng chỉ</h3>
        {p.certifications?.length ? (
          <ul>
            {p.certifications.map((certificate, index) => (
              <li key={index}>
                {certificate.name} · {certificate.issuer} ·{" "}
                {certificate.issueYear}
                {/^\/uploads\/[a-zA-Z0-9_./-]+$/.test(certificate.fileUrl) && (
                  <a
                    className="ml-2 underline"
                    href={certificate.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Xem tài liệu {certificate.name}
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>Không có chứng chỉ đã khai báo.</p>
        )}
      </div>
      <ReviewHistoryList items={detail.history} />
      <fieldset
        disabled={
          busy ||
          stale ||
          p.status !== "PENDING_REVIEW" ||
          detail.accountStatus !== "ACTIVE"
        }
        className="space-y-3"
      >
        <TextArea
          label="Lý do / ghi chú duyệt"
          value={note}
          maxLength={4000}
          onChange={(event) => setNote(event.target.value)}
        />
        <div className="flex flex-wrap gap-3">
          <Button variant="success" onClick={() => void decide("APPROVE")}>
            Phê duyệt
          </Button>
          <Button
            variant="secondary"
            onClick={() => void decide("REQUEST_CHANGES")}
          >
            Yêu cầu sửa
          </Button>
          <Button variant="danger" onClick={() => void decide("REJECT")}>
            Từ chối
          </Button>
        </div>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      {stale && <Button onClick={reload}>Tải lại hồ sơ</Button>}
    </Card>
  );
}
