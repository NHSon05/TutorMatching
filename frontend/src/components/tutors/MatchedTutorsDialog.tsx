"use client";

import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TutorCard } from "./TutorCard";
import type { TutorListItemResponse } from "@/lib/api/tutors";
import type {
  MatchedTutorCardItem,
  SubmitTutorDemandResponse,
} from "@/lib/api/tutor-demands";

export interface MatchedTutorsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  queryText: string;
  result: SubmitTutorDemandResponse | null;
  onHireClick?: (tutorId: string) => void;
}

const MODE_LABELS: Record<string, string> = {
  ONLINE: "Trực tuyến (Online)",
  OFFLINE: "Trực tiếp tại nhà",
  HYBRID: "Kết hợp (Hybrid)",
};

export function formatTuitionBadgeText(
  tuitionFeeVnd: number,
  feePeriod: string,
  isFeeNegotiable: boolean
): string | null {
  if (isFeeNegotiable && tuitionFeeVnd <= 0) {
    return "Học phí: Thỏa thuận";
  }
  if (tuitionFeeVnd <= 0) {
    return null;
  }
  const suffix =
    feePeriod === "PER_MONTH"
      ? "đ/tháng"
      : feePeriod === "TOTAL"
        ? "đ trọn gói"
        : "đ/buổi";
  return `${tuitionFeeVnd.toLocaleString("vi-VN")}${suffix}`;
}

function mapMatchedTutorToCardModel(
  tutor: MatchedTutorCardItem
): TutorListItemResponse {
  const modes =
    tutor.teachingModes && tutor.teachingModes.length > 0
      ? tutor.teachingModes
      : [tutor.teachingModeCode];

  return {
    id: tutor.tutorProfileId,
    displayName: tutor.displayName,
    avatarUrl: tutor.avatarUrl,
    bio: tutor.bio ?? null,
    qualification: tutor.degree ?? tutor.headline ?? null,
    schoolName: tutor.schoolName ?? null,
    specialization: tutor.specialization ?? null,
    experienceYears: tutor.experienceYears ?? null,
    teachingMethodology:
      tutor.teachingMethodology ?? tutor.achievementsAndResults ?? null,
    achievements: tutor.achievementsAndResults ?? null,
    sessionRateVnd: tutor.sessionRateVnd ?? tutor.listedPriceVnd,
    teachingModes: modes,
    provinceCode: null,
    provinceName: tutor.provinceName,
    districtCode: null,
    districtName: tutor.districtName,
    subjects: tutor.subjects.map((subjectName, idx) => ({
      subjectId: `${tutor.tutorProfileId}-subject-${idx}`,
      name: subjectName,
      levelCodes: [],
      levelNames: [],
    })),
    approvedAt: "APPROVED",
  };
}

export function MatchedTutorsDialog({
  isOpen,
  onClose,
  queryText,
  result,
  onHireClick,
}: MatchedTutorsDialogProps) {
  if (!result) return null;

  const { extractedCriteria, matchedTutors } = result;
  const criteriaFeeLabel = formatTuitionBadgeText(
    extractedCriteria.tuitionFeeVnd,
    extractedCriteria.feePeriod,
    extractedCriteria.isFeeNegotiable
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="big_size"
      className="max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
      title={`Kết quả gia sư phù hợp (${matchedTutors.length})`}
      description={queryText ? `Yêu cầu của bạn: "${queryText}"` : undefined}
    >
      <div className="space-y-4 overflow-y-auto max-h-[68vh] pr-1">
        {/* Extracted Criteria Summary Bar */}
        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700 p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-neutral-900 dark:text-gray-200">
              Tiêu chí đã nhận diện:
            </span>
            {extractedCriteria.subjectName && (
              <Badge variant="brand" size="medium">
                {`Môn: ${extractedCriteria.subjectName}`}
              </Badge>
            )}
            {extractedCriteria.gradeLevel && (
              <Badge variant="gray" size="medium">
                {`Lớp ${extractedCriteria.gradeLevel}`}
              </Badge>
            )}
            {criteriaFeeLabel && (
              <Badge variant="success" size="medium">
                {criteriaFeeLabel}
              </Badge>
            )}
            {extractedCriteria.districtName && (
              <Badge variant="brand" size="medium">
                {extractedCriteria.districtName}
              </Badge>
            )}
            {extractedCriteria.provinceName && (
              <Badge variant="gray" size="medium">
                {extractedCriteria.provinceName}
              </Badge>
            )}
            {extractedCriteria.teachingMode && (
              <Badge variant="brand" appearance="outline" size="medium">
                {MODE_LABELS[extractedCriteria.teachingMode] ??
                  extractedCriteria.teachingMode}
              </Badge>
            )}
          </div>

          {extractedCriteria.isLocationAmbiguous && (
            <div
              role="status"
              className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs text-amber-800"
            >
              Chưa xác định rõ Quận/Huyện cụ thể từ mô tả. Hệ thống đang hiển
              thị các gia sư nhận dạy toàn Tỉnh/Thành phố hoặc dạy Online.
            </div>
          )}
        </div>

        {/* Matched Tutors using standard TutorCard with suitable percent */}
        {matchedTutors.length > 0 ? (
          <div className="space-y-4">
            {matchedTutors.map((tutor) => (
              <TutorCard
                key={tutor.tutorProfileId}
                tutor={mapMatchedTutorToCardModel(tutor)}
                matchScore={tutor.matchScore}
                matchHighlights={tutor.matchHighlights}
                onBookTrial={(tutorId) => {
                  onClose();
                  if (onHireClick) {
                    onHireClick(tutorId);
                  } else if (typeof window !== "undefined") {
                    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                    window.location.href = `/tutors/${tutorId}`;
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-center space-y-2">
            <p className="text-base font-semibold text-neutral-900 dark:text-gray-200">
              Chưa có gia sư khớp trực tiếp ngay lúc này
            </p>
            <p className="text-sm text-neutral-900 dark:text-gray-400">
              Yêu cầu của bạn đã được lưu và gửi thông báo thời gian thực tới
              các gia sư phù hợp trong hệ thống.
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}

export default MatchedTutorsDialog;
