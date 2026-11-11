"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePostMatchStream } from "@/hooks/usePostMatchStream";

export function TutorLiveMatchedPostsFeed() {
  const { status, liveItems } = usePostMatchStream({ enabled: true });

  const statusBadge =
    status === "connected" ? (
      <Badge variant="success" dot size="small">
        Đang nhận thông báo trực tuyến
      </Badge>
    ) : status === "reconnecting" ? (
      <Badge variant="warning" dot size="small">
        Đang kết nối lại SSE...
      </Badge>
    ) : (
      <Badge variant="gray" size="small">
        Chưa kết nối
      </Badge>
    );

  return (
    <Card padding="medium" className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Yêu cầu tìm gia sư phù hợp theo thời gian thực
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tự động cập nhật tức thì qua Server-Sent Events (SSE) khi học viên
            đăng nhu cầu khớp hồ sơ của bạn.
          </p>
        </div>
        {statusBadge}
      </div>

      {liveItems.length === 0 ? (
        <p className="text-xs text-gray-500 py-4">
          Chưa có yêu cầu mới nào trong phiên trực tuyến này.
        </p>
      ) : (
        <div className="space-y-3">
          {liveItems.map((item) => (
            <Card key={item.notificationId} padding="small" className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  {`${item.subjectName} • Lớp ${item.gradeLevel}`}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="brand" size="small">
                    {`${item.tuitionFeeVnd.toLocaleString("vi-VN")}đ/buổi`}
                  </Badge>
                  <Badge variant="success" size="small">
                    {`Khớp ${Math.round(item.matchScore * 100)}%`}
                  </Badge>
                </div>
              </div>

              <p className="text-xs text-gray-700 dark:text-gray-300">
                {item.rawContent}
              </p>

              <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                <span>
                  {item.districtName
                    ? `${item.districtName}, ${item.provinceName}`
                    : item.provinceName}
                </span>
                {item.isLocationAmbiguous && (
                  <Badge variant="warning" size="small">
                    Địa chỉ chưa rõ Quận/Huyện
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}

export default TutorLiveMatchedPostsFeed;
