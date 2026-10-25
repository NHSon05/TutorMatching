"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { publicAvatarUrl } from "@/lib/api/tutors";
import { HireTutorDialog } from "./HireTutorDialog";
import type { TutorCardProps } from "./TutorCard.types";

export type { TutorCardProps } from "./TutorCard.types";

const modeNames: Record<string, string> = {
  ONLINE: "Trực tuyến",
  OFFLINE: "Trực tiếp",
  HYBRID: "Kết hợp",
};

function ShieldCheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.014 8.06a.75.75 0 0 0-1.06-1.06L10.5 13.14l-1.97-1.97a.75.75 0 0 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.06 0l4.5-4.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ClipboardCheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}

function GraduationCapIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21.42 10.922a1 1 0 0 0-.019-.838L12.83 3.18a2 2 0 0 0-1.66 0L2.6 10.084a1 1 0 0 0 0 1.832l8.57 6.908a2 2 0 0 0 1.66 0l8.57-6.9a1 1 0 0 0 .02-.002z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function LanguagesIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}

function MapPinIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/**
 * Component TutorCard hiển thị thông tin thực tế từ database (API /api/v1/tutors)
 * Sử dụng 100% các component có sẵn trong hệ thống: Card, Avatar, Badge, Button, IconButton.
 */
export function TutorCard({
  tutor,
  className = "",
  onBookTrial,
  onSendMessage,
  onToggleFavorite,
}: TutorCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHireOpen, setIsHireOpen] = useState(false);

  const id = tutor.id;
  const name = tutor.displayName;
  const avatarSrc = publicAvatarUrl(tutor.avatarUrl);

  const qualificationText = [tutor.qualification, tutor.schoolName]
    .filter(Boolean)
    .join(" • ");

  const locationText = [tutor.districtName, tutor.provinceName]
    .filter(Boolean)
    .join(", ");

  const modesText =
    tutor.teachingModes && tutor.teachingModes.length > 0
      ? tutor.teachingModes.map((m) => modeNames[m] || m).join(" / ")
      : "";

  const handleBookTrial = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onBookTrial) {
      onBookTrial(id);
    } else {
      setIsHireOpen(true);
    }
  };

  const handleSendMessage = (e: React.MouseEvent) => {
    if (onSendMessage) {
      e.preventDefault();
      onSendMessage(id);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = !isFavorite;
    setIsFavorite(next);
    onToggleFavorite?.(id, next);
  };

  return (
    <Card
      hoverable
      padding="large"
      data-testid={`tutor-card-${id}`}
      className={`relative flex flex-col md:flex-row justify-between gap-6 border-border-default bg-surface-card rounded-2xl shadow-xs transition-shadow hover:border-black ${className}`}
    >
      {/* Cột trái: Avatar + Khối thông tin chi tiết */}
      <div className="flex flex-col sm:flex-row gap-5 items-start flex-1 min-w-0">
        {/* Component Avatar chính hãng từ Design System */}
        <Avatar
          src={avatarSrc}
          alt={name}
          fallbackText={name}
          size="xlarge"
          shape="rounded"
          status={tutor.approvedAt ? "online" : undefined}
          className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 border border-border-default"
        />

        {/* Khối nội dung thông tin gia sư */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Tên gia sư + Huy hiệu xác thực + Khu vực */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href={`/tutors/${id}`}
                className="text-2xl font-bold text-content-primary hover:text-brand transition-colors tracking-tight"
              >
                {name}
              </Link>
              {tutor.approvedAt && (
                <span
                  title="Gia sư đã được kiểm duyệt"
                  className="inline-flex items-center text-brand"
                >
                  <ShieldCheckIcon className="w-4 h-4 fill-current" />
                </span>
              )}
              {locationText && (
                <span className="inline-flex items-center gap-1 text-xs text-content-secondary">
                  <MapPinIcon className="w-3.5 h-3.5 text-content-muted" />
                  {locationText}
                </span>
              )}
            </div>

            {/* Dòng 2: Trình độ chuyên môn & Trường học */}
            {qualificationText && (
              <div className="flex items-center gap-2 text-base text-content-secondary font-medium mt-2">
                <ClipboardCheckIcon className="w-4 h-4 text-content-secondary shrink-0" />
                <span>{qualificationText}</span>
              </div>
            )}

            {/* Dòng 3: Môn học giảng dạy thực tế */}
            {tutor.subjects && tutor.subjects.length > 0 && (
              <div className="flex items-center gap-2 text-base text-content-secondary font-medium mt-1">
                <GraduationCapIcon className="w-4 h-4 text-content-secondary shrink-0" />
                <span>{tutor.subjects.map((s) => s.name).join(", ")}</span>
              </div>
            )}

            {/* Dòng 4: Hình thức dạy & Chuyên ngành */}
            {(modesText || tutor.specialization) && (
              <div className="flex items-center gap-2 text-base text-content-secondary font-medium mt-1">
                <LanguagesIcon className="w-4 h-4 text-content-secondary shrink-0" />
                <span>
                  {[modesText, tutor.specialization].filter(Boolean).join(" • ")}
                </span>
              </div>
            )}

            {/* Dòng 5: Phương pháp giảng dạy thực tế (USP Badge) */}
            {tutor.teachingMethodology && (
              <div>
                <Badge
                  variant="admin"
                  appearance="subtitle"
                  shape="rounded"
                  size="large"
                  className="mt-2.5 font-medium"
                >
                  {tutor.teachingMethodology}
                </Badge>
              </div>
            )}

            {/* Dòng 6: Giới thiệu tóm tắt từ database */}
            {tutor.bio && (
              <p className="mt-2 text-base text-content-secondary leading-relaxed line-clamp-2">
                {tutor.bio}
              </p>
            )}
          </div>

          {/* Dòng 7: Liên kết xem chi tiết */}
          <Link
            href={`/tutors/${id}`}
            aria-label={`Xem hồ sơ ${name}`}
            className="mt-2 inline-block text-base font-bold text-content-primary underline underline-offset-2 hover:text-brand"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>

      {/* Cột phải: Học phí + Nút yêu thích + Thống kê + Nút hành động */}
      <div className="flex flex-col justify-between shrink-0 md:w-64 lg:w-72 pt-4 md:pt-0 border-t md:border-t-0 border-border-default">
        <div>
          {/* Hàng trên: Giá tiền bên trái, Trái tim yêu thích bên phải */}
          <div className="flex items-start justify-between">
            <div
              className="flex flex-col"
              aria-label={`${tutor.sessionRateVnd.toLocaleString("vi-VN")} VNĐ/buổi`}
            >
              <span className="text-3xl font-bold text-content-primary tracking-tight">
                {tutor.sessionRateVnd.toLocaleString("vi-VN")}đ
              </span>
              <span className="text-xs sm:text-sm text-content-secondary mt-0.5 font-medium">
                Học phí theo buổi
              </span>
            </div>

            {/* Component IconButton cho nút yêu thích */}
            <IconButton
              aria-label="Lưu gia sư yêu thích"
              variant="ghost"
              shape="circle"
              size="large"
              onClick={handleToggleFavorite}
              icon={
                <svg
                  className={`w-6 h-6 transition-transform active:scale-90 ${
                    isFavorite
                      ? "fill-status-error text-status-error"
                      : "fill-none stroke-current stroke-2 text-content-primary"
                  }`}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              }
            />
          </div>

          {/* Hàng giữa: Khối thông số thực tế từ DB (Kinh nghiệm, Môn dạy, Hình thức) */}
          <div className="flex items-center gap-6 sm:gap-7 my-5">
            <div>
              <div className="font-bold text-base text-content-primary">
                {tutor.experienceYears != null ? `${tutor.experienceYears} năm` : "—"}
              </div>
              <div className="text-xs text-content-secondary">
                kinh nghiệm
              </div>
            </div>
            <div>
              <div className="font-bold text-base text-content-primary">
                {tutor.subjects?.length ?? 0}
              </div>
              <div className="text-xs text-content-secondary">
                môn dạy
              </div>
            </div>
            <div>
              <div className="font-bold text-base text-content-primary">
                {tutor.teachingModes?.length ?? 0}
              </div>
              <div className="text-xs text-content-secondary">
                hình thức
              </div>
            </div>
          </div>
        </div>

        {/* Hàng dưới: Các nút hành động chính hãng Button từ Design System */}
        <div className="flex flex-col gap-2.5 w-full mt-2">
          <Button
            type="button"
            variant="brand"
            size="large"
            shape="rounded"
            isFullWidth
            onClick={handleBookTrial}
          >
            Đăng ký ngay
          </Button>

          <Button
            asChild
            variant="secondary"
            size="large"
            shape="rounded"
            isFullWidth
          >
            <Link
              href={`/messages?tutorId=${id}`}
              onClick={handleSendMessage}
            >
              Nhắn tin
            </Link>
          </Button>
        </div>
      </div>

      {!onBookTrial && (
        <HireTutorDialog
          isOpen={isHireOpen}
          onClose={() => setIsHireOpen(false)}
          tutorId={id}
          tutor={tutor}
        />
      )}
    </Card>
  );
}

export default TutorCard;
