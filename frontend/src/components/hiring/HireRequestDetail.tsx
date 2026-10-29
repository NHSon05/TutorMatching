"use client";

import * as React from "react";
import type { HireDetail, HireTermsDto } from "@/lib/api/hire-requests";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TextArea } from "@/components/ui/text-area";

export interface HireRequestDetailProps {
  detail: HireDetail;
  onAccept?: () => void;
  onReject?: (reason: string) => void;
  onRefresh?: () => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
  errorMessage?: string | null;
  isConflict?: boolean;
  reasonDraft?: string;
  onReasonDraftChange?: (reason: string) => void;
}

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Chờ phản hồi", variant: "warning" },
  NEGOTIATING: { label: "Đang thương lượng", variant: "brand" },
  ACCEPTED: { label: "Đã chấp nhận", variant: "success" },
  REJECTED: { label: "Đã từ chối", variant: "error" },
  CANCELLED: { label: "Đã hủy", variant: "gray" },
  COMPLETED: { label: "Đã hoàn thành", variant: "success" },
};

const dayNames: Record<number, string> = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  7: "Chủ nhật",
};

const modeNames: Record<string, string> = {
  ONLINE: "Trực tuyến (Online)",
  OFFLINE: "Gặp trực tiếp (Offline)",
  HYBRID: "Kết hợp (Hybrid)",
};

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

function formatDate(isoDate: string) {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoDate;
  }
}

export function HireRequestDetail({
  detail,
  onAccept,
  onReject,
  onRefresh,
  isAccepting = false,
  isRejecting = false,
  errorMessage = null,
  isConflict = false,
  reasonDraft,
  onReasonDraftChange,
}: HireRequestDetailProps) {
  const [internalReason, setInternalReason] = React.useState("");
  const [reasonError, setReasonError] = React.useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = React.useState(false);

  const reason = reasonDraft !== undefined ? reasonDraft : internalReason;
  const setReason = (val: string) => {
    if (onReasonDraftChange) onReasonDraftChange(val);
    else setInternalReason(val);
  };

  const statusInfo = statusConfig[detail.status] || {
    label: detail.status,
    variant: "gray" as BadgeVariant,
  };

  const canAccept = detail.allowedActions.includes("accept");
  const canReject = detail.allowedActions.includes("reject");

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError("Nhập lý do từ 1 đến 1000 ký tự, không chỉ chứa khoảng trắng.");
      return;
    }
    if (trimmed.length > 1000) {
      setReasonError("Lý do không được vượt quá 1000 ký tự.");
      return;
    }
    setReasonError(null);
    onReject?.(trimmed);
  };

  const renderTerms = (terms: HireTermsDto, title: string) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-content-secondary">Ngày bắt đầu: </span>
            <span className="font-medium text-content-primary">{terms.startDate}</span>
          </div>
          <div>
            <span className="text-content-secondary">Học phí: </span>
            <span className="font-semibold text-role-tutor text-base">
              {formatVnd(terms.priceVnd)} / buổi
            </span>
          </div>
          <div>
            <span className="text-content-secondary">Tần suất & Thời lượng: </span>
            <span className="font-medium text-content-primary">
              {terms.sessionsPerWeek} buổi/tuần • {terms.durationMinutes} phút/buổi
            </span>
          </div>
          <div>
            <span className="text-content-secondary">Hình thức học: </span>
            <span className="font-medium text-content-primary">
              {modeNames[terms.teachingMode] || terms.teachingMode}
            </span>
          </div>
          {(terms.locationDetail || terms.provinceCode || terms.districtCode) && (
            <div className="sm:col-span-2">
              <span className="text-content-secondary">Địa điểm học: </span>
              <span className="font-medium text-content-primary">
                {[terms.locationDetail, terms.districtCode, terms.provinceCode]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}
        </div>

        <div>
          <span className="text-content-secondary block mb-1 font-medium">Lịch học trong tuần:</span>
          <div className="flex flex-wrap gap-2">
            {terms.schedules.map((s, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
              >
                {dayNames[s.dayOfWeek] || `Thứ ${s.dayOfWeek}`}: {s.startTime} - {s.endTime}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Card */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4 mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-content-primary">
                  Chi tiết yêu cầu thuê gia sư
                </h1>
                <Badge role="status" aria-label="Trạng thái yêu cầu" variant={statusInfo.variant} appearance="solid" shape="pill">
                  {statusInfo.label}
                </Badge>
              </div>
              <p className="text-xs text-content-muted mt-1">Mã yêu cầu: {detail.id}</p>
            </div>
            {onRefresh && (
              <Button
                variant="secondary"
                size="small"
                onClick={onRefresh}
                disabled={isAccepting || isRejecting}
              >
                Làm mới dữ liệu
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-surface-card rounded-xl border border-border-default">
              <span className="text-content-secondary block text-xs">Học viên gửi yêu cầu</span>
              <span className="font-semibold text-content-primary text-base">
                {detail.learner.displayName}
              </span>
            </div>
            <div className="p-3 bg-surface-card rounded-xl border border-border-default">
              <span className="text-content-secondary block text-xs">Gia sư nhận yêu cầu</span>
              <span className="font-semibold text-content-primary text-base">
                {detail.tutor.displayName}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Conflict / Error Banner */}
      {isConflict && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div>
            <p className="font-semibold">Dữ liệu yêu cầu đã được cập nhật bởi thao tác khác.</p>
            <p className="text-amber-800 text-xs mt-0.5">
              Nội dung bạn đang nhập đã được giữ lại. Vui lòng làm mới dữ liệu để kiểm tra trạng thái mới nhất trước khi gửi lại.
            </p>
          </div>
          {onRefresh && (
            <Button
              variant="tutor"
              size="small"
              onClick={onRefresh}
              className="shrink-0"
            >
              Làm mới ngay
            </Button>
          )}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-sm"
        >
          {errorMessage}
        </div>
      )}

      {/* Final Agreement (if accepted) */}
      {detail.finalAgreement && (
        <Card className="border-emerald-300 bg-emerald-50/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-emerald-900">
                Thỏa thuận đã thống nhất (Final Agreement)
              </CardTitle>
              <Badge variant="success" appearance="solid">Đã chốt</Badge>
            </div>
            <p className="text-xs text-emerald-800">
              Được chấp nhận lúc {formatDate(detail.finalAgreement.acceptedAt)}
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-emerald-950">
            <div>
              <span className="text-emerald-800 font-medium">Học phí thống nhất: </span>
              <span className="font-bold text-base">
                {formatVnd(detail.finalAgreement.terms.priceVnd)} / buổi
              </span>
            </div>
            <div>
              <span className="text-emerald-800 font-medium">Lịch học chốt: </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {detail.finalAgreement.terms.schedules.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-900 border border-emerald-200"
                  >
                    {dayNames[s.dayOfWeek] || `Thứ ${s.dayOfWeek}`}: {s.startTime} - {s.endTime}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initial & Current Terms */}
      {renderTerms(detail.currentTerms, "Điều khoản hiện tại")}

      {detail.proposals.length > 0 && (
        renderTerms(detail.initialTerms, "Điều khoản ban đầu")
      )}

      {/* Response Actions for Tutor */}
      {(canAccept || canReject) && (
        <Card className="border-role-tutor/40">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-content-primary">
              Phản hồi yêu cầu
            </CardTitle>
            <p className="text-xs text-content-secondary">
              Bạn có thể chấp nhận điều khoản ban đầu hoặc từ chối yêu cầu này.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {canAccept && (
                <Button
                  variant="success"
                  onClick={onAccept}
                  isLoading={isAccepting}
                  disabled={isAccepting || isRejecting}
                >
                  Chấp nhận yêu cầu
                </Button>
              )}
              {canReject && !showRejectForm && (
                <Button
                  variant="danger"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isAccepting || isRejecting}
                >
                  Từ chối yêu cầu...
                </Button>
              )}
            </div>

            {/* Rejection Form */}
            {canReject && showRejectForm && (
              <form onSubmit={handleRejectSubmit} className="mt-4 p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
                <TextArea
                  label="Lý do từ chối (bắt buộc)"
                  placeholder="Nhập lý do từ chối để học viên nắm thông tin (1–1000 ký tự)..."
                  rows={4}
                  maxLength={1000}
                  showCount
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (reasonError) setReasonError(null);
                  }}
                  error={reasonError || undefined}
                  helperText="Lý do không được chỉ chứa khoảng trắng, tối đa 1000 ký tự."
                />
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="submit"
                    variant="danger"
                    size="small"
                    isLoading={isRejecting}
                    disabled={isAccepting || isRejecting}
                  >
                    Xác nhận từ chối
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => setShowRejectForm(false)}
                    disabled={isRejecting}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Lịch sử trạng thái</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {detail.history.map((event) => {
              const toInfo = statusConfig[event.toStatus] || { label: event.toStatus, variant: "gray" };
              return (
                <div
                  key={event.sequence}
                  className="flex items-start gap-3 p-3 rounded-xl bg-surface-card border border-border-default text-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-content-secondary shrink-0 mt-0.5">
                    #{event.sequence}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-content-primary">
                        Chuyển sang:
                      </span>
                      <Badge variant={toInfo.variant} appearance="subtitle" size="small">
                        {toInfo.label}
                      </Badge>
                      <span className="text-xs text-content-muted ml-auto">
                        {formatDate(event.createdAt)}
                      </span>
                    </div>
                    {event.reason && (
                      <p className="text-xs text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-1">
                        <span className="font-semibold">Lý do: </span>
                        {event.reason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default HireRequestDetail;
