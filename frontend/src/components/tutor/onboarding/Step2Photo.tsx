"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { uploadTutorAvatar } from "@/lib/api/tutor-onboarding";

interface Step2PhotoProps {
  avatarUrl?: string;
  onUploaded: (url: string) => void | Promise<void>;
  onUploadingChange?: (uploading: boolean) => void;
  error?: string;
}

export function Step2Photo({ avatarUrl, onUploaded, error, onUploadingChange }: Step2PhotoProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Vui lòng chọn tệp định dạng ảnh (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Kích thước ảnh không được vượt quá 5MB.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    onUploadingChange?.(true);

    try {
      const res = await uploadTutorAvatar(file);
      await onUploaded(res.fileUrl);
    } catch {
      setUploadError("Tải ảnh lên thất bại. Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">2. Ảnh đại diện hồ sơ</h2>
        <p className="text-sm text-gray-500 mt-1">
          Hồ sơ có ảnh chân dung rõ nét, chuyên nghiệp nhận được nhiều hơn 85% lời mời dạy từ phụ huynh.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 p-6 bg-white rounded-2xl border border-gray-200">
        {/* Khung hiển thị ảnh đại diện */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-amber-500/20 bg-gray-100 shadow-md flex items-center justify-center">
            {avatarUrl ? (
              <Image
                src={avatarUrl.startsWith("http") ? avatarUrl : `http://localhost:5014${avatarUrl}`}
                alt="Avatar preview"
                fill
                sizes="144px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span className="text-xs font-medium">Chưa có ảnh</span>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <Button
            type="button"
            variant="tutor"
            size="small"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? "Đang tải ảnh lên..." : avatarUrl ? "Thay đổi ảnh" : "Chọn ảnh từ máy"}
          </Button>
        </div>

        {/* Hướng dẫn chụp ảnh thẻ chuẩn */}
        <div className="flex-1 space-y-3 text-xs text-gray-600">
          <h4 className="font-semibold text-gray-900 text-sm">Tiêu chuẩn ảnh hồ sơ chuẩn gia sư:</h4>
          <ul className="space-y-2 list-disc list-inside text-gray-600">
            <li>Ảnh chân dung chụp rõ mặt, ánh sáng tốt và nền sáng sạch sẽ.</li>
            <li>Trang phục lịch sự (áo sơ mi, áo đồng phục hoặc trang phục chỉnh tề).</li>
            <li>Nét mặt tươi tắn, biểu cảm thân thiện tạo thiện cảm với phụ huynh & học sinh.</li>
            <li>Không dùng ảnh chụp từ xa, ảnh tập thể hoặc ảnh che mặt, đeo kính đen.</li>
            <li>Hỗ trợ định dạng JPG, PNG, WEBP dung lượng tối đa 5MB.</li>
          </ul>

          {(uploadError || error) && (
            <p className="text-xs text-red-600 font-semibold pt-2">
              {uploadError || error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
