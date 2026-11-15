"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { TextArea } from "@/components/ui/text-area";
import { Dropdown } from "@/components/ui/dropdown";
import { getTutorOnboarding } from "@/lib/api/tutor-onboarding";
import { getPublicCatalog } from "@/lib/api/catalog";
import {
  getCourses,
  saveCourse,
  removeOffer,
  type CourseInput,
} from "@/lib/api/tutor-offers";
import { useAuthenticatedAccount } from "@/hooks/use-authenticated-account";
import { ApiError } from "@/lib/api/http";
import { TutorScheduleClient } from "@/components/tutor/schedule/TutorScheduleClient";

const emptyCourse: CourseInput = {
  subjectId: "",
  name: "",
  content: "",
  sessionCount: 1,
  pricePerSessionVnd: 100000,
  status: "ACTIVE",
};

/** "Lịch dạy": weekly calendar with free time and lessons, then the course offers. */
export default function TutorOffersEditor() {
  const account = useAuthenticatedAccount();
  return (
    <div key={account.id} className="space-y-10">
      <TutorScheduleClient accountId={account.id} />
      <TutorOffersEditorForm accountId={account.id} />
    </div>
  );
}

export function TutorOffersEditorForm({ accountId }: { accountId: string }) {
  const cache = useQueryClient();
  const [course, setCourse] = useState(emptyCourse);
  const [courseId, setCourseId] = useState<string>();
  const courses = useQuery({
    queryKey: ["tutor-offer-courses", accountId],
    queryFn: ({ signal }) => getCourses(signal),
  });
  const subjects = useQuery({
    queryKey: ["tutor-offer-subjects", accountId],
    queryFn: async ({ signal }) => {
      const [profile, all] = await Promise.all([
        getTutorOnboarding(signal),
        getPublicCatalog("subjects", signal),
      ]);
      return all.filter((s) =>
        profile.discovery?.subjects?.some(
          (selected) => selected.subjectId === s.code
        )
      );
    },
  });
  const mutation = useMutation({
    mutationFn: async (action: "save" | "stop") => {
      if (action === "save") return saveCourse(course, courseId);
      if (courseId) await removeOffer("courses", courseId);
    },
    onSuccess: async () => {
      setCourse(emptyCourse);
      setCourseId(undefined);
      await cache.invalidateQueries({
        queryKey: ["tutor-offer-courses", accountId],
      });
    },
  });
  function resetCourse() {
    setCourse(emptyCourse);
    setCourseId(undefined);
    mutation.reset();
  }

  if (courses.isPending || subjects.isPending)
    return <p role="status">Đang tải khóa học…</p>;
  if (courses.isError || subjects.isError)
    return (
      <div role="alert">
        Không tải được dữ liệu khóa học.{" "}
        <Button
          onClick={() => {
            courses.refetch();
            subjects.refetch();
          }}
        >
          Thử lại
        </Button>
      </div>
    );

  return (
    <section
      className="space-y-4 text-content-primary"
      aria-labelledby="tutor-courses-heading"
    >
      <h2 id="tutor-courses-heading" className="text-xl font-bold">
        Khóa học
      </h2>
      {mutation.isPending && <p role="status">Đang lưu thay đổi…</p>}
      {mutation.isError && (
        <p role="alert" className="text-status-error">
          {mutation.error instanceof ApiError
            ? Object.values(mutation.error.errors ?? {})
                .flat()
                .join(" ") || mutation.error.title
            : "Không lưu được. Nội dung nhập được giữ lại; hãy thử lại."}
        </p>
      )}
      <fieldset
        disabled={mutation.isPending}
        className="space-y-4 rounded-lg border border-border-default bg-surface-card p-4"
      >
        <legend className="sr-only">Khóa học</legend>
        {courses.data.length === 0 && <p>Chưa có khóa học.</p>}
        {subjects.data.length === 0 && (
          <p>Chọn môn nhận dạy trong hồ sơ trước khi tạo khóa học.</p>
        )}
        <ul className="space-y-2">
          {courses.data.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span>
                {c.name} · {c.status === "ACTIVE" ? "Đang mở" : "Đã ẩn"}
              </span>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  mutation.reset();
                  setCourseId(c.id);
                  setCourse({
                    subjectId: c.subjectId,
                    name: c.name,
                    content: c.content,
                    status: c.status,
                    sessionCount: c.sessionCount ?? 0,
                    pricePerSessionVnd: c.pricePerSessionVnd ?? 0,
                  });
                }}
              >
                Sửa {c.name}
              </Button>
            </li>
          ))}
        </ul>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate("save");
          }}
        >
          <TextField
            label="Tên khóa học"
            required
            maxLength={200}
            value={course.name}
            onChange={(e) => setCourse({ ...course, name: e.target.value })}
          />
          <Dropdown
            label="Môn học"
            value={course.subjectId}
            options={subjects.data.map((s) => ({
              value: s.code,
              label: s.name,
            }))}
            onChange={(subjectId) => setCourse({ ...course, subjectId })}
          />
          <TextArea
            label="Nội dung khóa học"
            required
            maxLength={4000}
            value={course.content}
            onChange={(e) => setCourse({ ...course, content: e.target.value })}
          />
          <TextField
            label="Số buổi"
            type="number"
            min={1}
            max={2147483647}
            step={1}
            required
            value={course.sessionCount || ""}
            onChange={(e) =>
              setCourse({ ...course, sessionCount: Number(e.target.value) })
            }
          />
          <TextField
            label="Giá mỗi buổi (VND)"
            type="number"
            min={1}
            max={2147483647}
            step={1}
            required
            value={course.pricePerSessionVnd || ""}
            onChange={(e) =>
              setCourse({
                ...course,
                pricePerSessionVnd: Number(e.target.value),
              })
            }
          />
          <Dropdown
            label="Trạng thái khóa học"
            value={course.status}
            options={[
              { value: "ACTIVE", label: "Đang mở" },
              { value: "HIDDEN", label: "Ẩn" },
            ]}
            onChange={(status) =>
              setCourse({ ...course, status: status as CourseInput["status"] })
            }
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!course.subjectId}>
              Lưu khóa học
            </Button>
            {courseId && (
              <Button
                type="button"
                variant="danger"
                onClick={() => mutation.mutate("stop")}
              >
                Ngừng khóa học đang sửa
              </Button>
            )}
            <Button type="button" variant="tertiary" onClick={resetCourse}>
              Hủy chỉnh sửa khóa học
            </Button>
          </div>
        </form>
      </fieldset>
    </section>
  );
}
