"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { uploadTutorCertificate, type TutorCertificationDto } from "@/lib/api/tutor-onboarding";

interface Step3CertificationsProps {
  hasCertifications: boolean;
  certifications: TutorCertificationDto[];
  onToggleHasCerts: (hasCerts: boolean) => void;
  onUpdateCertifications: (certs: TutorCertificationDto[]) => void;
  error?: string;
}

export function Step3Certifications({
  hasCertifications,
  certifications,
  onToggleHasCerts,
  onUpdateCertifications,
  error,
}: Step3CertificationsProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetIndexRef = useRef<number>(0);

  const handleAddCertificate = () => {
    onUpdateCertifications([
      ...certifications,
      { name: "", issuer: "", issueYear: new Date().getFullYear(), fileUrl: "" },
    ]);
  };

  const handleRemoveCertificate = (index: number) => {
    onUpdateCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleChangeCert = (
    index: number,
    field: keyof TutorCertificationDto,
    val: string | number | undefined
  ) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: val };
    onUpdateCertifications(updated);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFileError("Kích thước file chứng chỉ tối đa là 10MB.");
      return;
    }

    setFileError(null);
    const index = targetIndexRef.current;
    setUploadingIndex(index);

    try {
      const res = await uploadTutorCertificate(file);
      handleChangeCert(index, "fileUrl", res.fileUrl);
    } catch {
      setFileError("Không thể tải lên tệp chứng chỉ. Vui lòng thử lại.");
    } finally {
      setUploadingIndex(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerUpload = (index: number) => {
    targetIndexRef.current = index;
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">3. Chứng chỉ & Bằng cấp chuyên môn</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tải lên chứng chỉ ngoại ngữ (IELTS, TOEIC, HSK, JLPT...) hoặc chứng chỉ nghiệp vụ sư phạm để tăng độ tin cậy.
        </p>
      </div>

      {/* Lựa chọn 2 trạng thái: Có hoặc Chưa có */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            onToggleHasCerts(false);
            onUpdateCertifications([]);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            !hasCertifications
              ? "border-amber-600 bg-amber-50/50 ring-1 ring-amber-600"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              !hasCertifications ? "border-amber-600 bg-amber-600 text-white text-xs" : "border-gray-300"
            }`}>
              {!hasCertifications && "✓"}
            </span>
            <span className="font-semibold text-sm text-gray-900">Tôi chưa có chứng chỉ</span>
          </div>
          <p className="text-xs text-gray-500 pl-6">
            Bạn vẫn có thể tiếp tục đăng ký và bổ sung chứng chỉ bất kỳ lúc nào sau này.
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            onToggleHasCerts(true);
            if (certifications.length === 0) {
              handleAddCertificate();
            }
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            hasCertifications
              ? "border-amber-600 bg-amber-50/50 ring-1 ring-amber-600"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              hasCertifications ? "border-amber-600 bg-amber-600 text-white text-xs" : "border-gray-300"
            }`}>
              {hasCertifications && "✓"}
            </span>
            <span className="font-semibold text-sm text-gray-900">Tôi có chứng chỉ muốn tải lên</span>
          </div>
          <p className="text-xs text-gray-500 pl-6">
            Gia sư có chứng chỉ xác thực sẽ nhận huy hiệu uy tín và được đề xuất ưu tiên.
          </p>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleUploadFile}
      />

      {/* Danh sách chứng chỉ nếu hasCertifications === true */}
      {hasCertifications && (
        <div className="space-y-4 pt-2">
          {certifications.map((cert, index) => (
            <div
              key={index}
              className="p-5 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                  Chứng chỉ #{index + 1}
                </span>
                {certifications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCertificate(index)}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    ✕ Xóa
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <TextField
                  label="Tên chứng chỉ"
                  required
                  placeholder="Ví dụ: IELTS 7.5, HSK 5, JLPT N2"
                  value={cert.name}
                  onChange={(e) => handleChangeCert(index, "name", e.target.value)}
                />

                <TextField
                  label="Đơn vị cấp bằng"
                  required
                  placeholder="Ví dụ: IDP, British Council"
                  value={cert.issuer}
                  onChange={(e) => handleChangeCert(index, "issuer", e.target.value)}
                />

                <TextField
                  label="Năm cấp"
                  type="number"
                  placeholder="Ví dụ: 2024"
                  value={cert.issueYear ?? ""}
                  onChange={(e) =>
                    handleChangeCert(
                      index,
                      "issueYear",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>

              {/* Tải tệp minh chứng */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                <div>
                  <span className="text-xs font-semibold text-gray-700 block">Tệp minh chứng (PDF hoặc Ảnh):</span>
                  {cert.fileUrl ? (
                    <span className="text-xs text-green-700 font-medium flex items-center gap-1 mt-0.5">
                      ✓ Đã tải tệp lên thành công
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 mt-0.5 block">Chưa tải tệp</span>
                  )}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  disabled={uploadingIndex === index}
                  onClick={() => triggerUpload(index)}
                >
                  {uploadingIndex === index ? "Đang tải lên..." : cert.fileUrl ? "Thay đổi tệp" : "Tải lên tệp"}
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="tertiary"
            size="small"
            onClick={handleAddCertificate}
            className="text-amber-700 hover:bg-amber-50"
          >
            + Thêm chứng chỉ khác
          </Button>

          {fileError && <p className="text-xs text-red-600 font-semibold">{fileError}</p>}
        </div>
      )}

      {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
    </div>
  );
}
