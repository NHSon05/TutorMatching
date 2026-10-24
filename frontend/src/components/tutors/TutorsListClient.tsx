"use client";
import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { TextField } from "@/components/ui/text-field";
import { SelectCheck } from "@/components/ui/select-check";
import { Accordion } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Dropdown } from "@/components/ui/dropdown";
import { getTutors, publicAvatarUrl } from "@/lib/api/tutors";
import { getPublicCatalog } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/http";
export type * from "./types";
export default function TutorsListClient() {
  return (
    <Suspense fallback={<p role="status">Đang tải tìm kiếm...</p>}>
      <SearchRoute />
    </Suspense>
  );
}
function SearchRoute() {
  const params = useSearchParams();
  return (
    <TutorSearchView key={params.toString()} queryString={params.toString()} />
  );
}
interface WindowInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}
const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const modeNames: Record<string, string> = {
  ONLINE: "Trực tuyến",
  OFFLINE: "Trực tiếp",
  HYBRID: "Kết hợp",
};
export function TutorSearchView({ queryString }: { queryString: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = new URLSearchParams(queryString);
  const [name, setName] = useState(params.get("name") ?? "");
  const [qualification, setQualification] = useState(
    params.get("qualification") ?? ""
  );
  const [subjects, setSubjects] = useState(params.getAll("subjectId"));
  const [levels, setLevels] = useState(params.getAll("levelCode"));
  const [modes, setModes] = useState(params.getAll("mode"));
  const [province, setProvince] = useState(params.get("provinceCode") ?? "");
  const [district, setDistrict] = useState(params.get("districtCode") ?? "");
  const [min, setMin] = useState(params.get("minPrice") ?? "");
  const [max, setMax] = useState(params.get("maxPrice") ?? "");
  const [scheduled, setScheduled] = useState(
    ["sessionsPerWeek", "durationMinutes", "weeklyWindows"].some((key) =>
      params.has(key)
    )
  );
  const [frequency, setFrequency] = useState(
    params.get("sessionsPerWeek") ?? "2"
  );
  const [duration, setDuration] = useState(
    params.get("durationMinutes") ?? "60"
  );
  const [windows, setWindows] = useState<WindowInput[]>(() => {
    try {
      const value: unknown = JSON.parse(params.get("weeklyWindows") ?? "null");
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        value.length <= 50 &&
        value.every(
          (w) =>
            w &&
            Number.isInteger(w.dayOfWeek) &&
            typeof w.startTime === "string" &&
            typeof w.endTime === "string"
        )
      )
        return value;
    } catch {
      /* Invalid URL criteria are reported by the API. */
    }
    return [{ dayOfWeek: 1, startTime: "18:00", endTime: "20:00" }];
  });
  const [validation, setValidation] = useState("");
  const catalog = useQuery({
    queryKey: ["public-search-catalogs"],
    meta: { public: true },
    queryFn: async ({ signal }) => {
      const [subjects, levels, provinces, districts] = await Promise.all([
        getPublicCatalog("subjects", signal),
        getPublicCatalog("teaching-levels", signal),
        getPublicCatalog("provinces", signal),
        getPublicCatalog("districts", signal),
      ]);
      return { subjects, levels, provinces, districts };
    },
  });
  const query = useQuery({
    queryKey: ["public-tutor-search", queryString],
    meta: { public: true },
    queryFn: ({ signal }) =>
      getTutors(new URLSearchParams(queryString), signal),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  function navigate(next: URLSearchParams) {
    router.push(next.size ? `${pathname}?${next}` : pathname);
  }
  function clearFilters() {
    setName("");
    setQualification("");
    setSubjects([]);
    setLevels([]);
    setModes([]);
    setProvince("");
    setDistrict("");
    setMin("");
    setMax("");
    setScheduled(false);
    setFrequency("2");
    setDuration("60");
    setWindows([{ dayOfWeek: 1, startTime: "18:00", endTime: "20:00" }]);
    setValidation("");
    navigate(new URLSearchParams());
  }
  function apply(event: FormEvent) {
    event.preventDefault();
    if (
      (min && Number(min) <= 0) ||
      (max && Number(max) <= 0) ||
      (min && max && Number(min) > Number(max))
    ) {
      setValidation("Khoảng giá theo buổi không hợp lệ.");
      return;
    }
    if (modes.some((m) => m !== "ONLINE") && (!province || !district)) {
      setValidation(
        "Chọn tỉnh/thành và quận/huyện khi tìm gia sư trực tiếp hoặc kết hợp."
      );
      return;
    }
    if (
      scheduled &&
      (!windows.length ||
        windows.some((w) => w.startTime >= w.endTime) ||
        Number(frequency) < 1 ||
        Number(frequency) > 21 ||
        Number(duration) < 30 ||
        Number(duration) > 240)
    ) {
      setValidation("Kiểm tra số buổi, thời lượng và giờ bắt đầu/kết thúc.");
      return;
    }
    setValidation("");
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({
      name: name.trim(),
      qualification: qualification.trim(),
      provinceCode: province,
      districtCode: district,
      minPrice: min,
      maxPrice: max,
      sort: params.get("sort") ?? "newest",
    }))
      if (value) next.set(key, value);
    subjects.forEach((value) => next.append("subjectId", value));
    levels.forEach((value) => next.append("levelCode", value));
    modes.forEach((value) => next.append("mode", value));
    if (scheduled) {
      next.set("sessionsPerWeek", frequency);
      next.set("durationMinutes", duration);
      next.set("weeklyWindows", JSON.stringify(windows));
    }
    navigate(next);
  }
  function page(number: number) {
    const next = new URLSearchParams(queryString);
    next.set("page", String(number));
    navigate(next);
  }
  return (
    <div className="min-h-screen bg-surface-base py-6 text-content-primary sm:py-8">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Danh sách gia sư
          </h1>
          <p className="text-sm text-content-secondary">
            Tìm kiếm và kết nối với gia sư phù hợp với nhu cầu học tập của bạn.
          </p>
        </header>
        <Card
          padding="large"
          className="relative z-10 rounded-3xl border-border-default shadow-sm"
        >
          <form onSubmit={apply} className="space-y-4">
            <TextField
              label="Tên gia sư"
              size="large"
              variant="filled"
              placeholder="Tìm theo tên gia sư..."
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              isClearable
              onClear={() => setName("")}
            />
            {catalog.isPending ? (
              <p role="status">Đang tải danh mục bộ lọc...</p>
            ) : catalog.isError ? (
              <div>
                <p role="alert">Không tải được danh mục.</p>
                <Button type="button" onClick={() => void catalog.refetch()}>
                  Thử lại danh mục
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SelectCheck
                  label="Môn học"
                  placeholder="Tất cả môn học"
                  options={catalog.data.subjects.map((s) => ({
                    value: s.code,
                    label: s.name,
                  }))}
                  values={subjects}
                  onChange={setSubjects}
                />
                <Dropdown
                  label="Tỉnh / thành phố"
                  value={province}
                  options={[
                    { value: "", label: "Tất cả tỉnh/thành" },
                    ...catalog.data.provinces.map((p) => ({
                      value: p.code,
                      label: p.name,
                    })),
                  ]}
                  onChange={(value) => {
                    setProvince(value);
                    setDistrict("");
                  }}
                />
                <SelectCheck
                  label="Cấp học có thể dạy"
                  placeholder="Tất cả cấp học"
                  options={catalog.data.levels.map((l) => ({
                    value: l.code,
                    label: l.name,
                  }))}
                  values={levels}
                  onChange={setLevels}
                />
                <SelectCheck
                  label="Hình thức dạy"
                  placeholder="Tất cả hình thức"
                  options={Object.entries(modeNames).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  values={modes}
                  onChange={setModes}
                  isSearchable={false}
                />
              </div>
            )}
            <Accordion
              defaultOpenIds={
                scheduled || qualification || min || max || district
                  ? ["advanced"]
                  : []
              }
              className="border-0!"
              items={[
                {
                  id: "advanced",
                  title: "Bộ lọc nâng cao: học phí, chuyên môn và lịch học",
                  children: (
                    <div className="space-y-4 pt-1">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <TextField
                          label="Bằng cấp / chuyên môn"
                          value={qualification}
                          maxLength={200}
                          onChange={(e) => setQualification(e.target.value)}
                        />
                        <TextField
                          label="Giá thấp nhất / buổi (VNĐ)"
                          type="number"
                          min={1}
                          step={1}
                          value={min}
                          onChange={(e) => setMin(e.target.value)}
                        />
                        <TextField
                          label="Giá cao nhất / buổi (VNĐ)"
                          type="number"
                          min={1}
                          step={1}
                          value={max}
                          onChange={(e) => setMax(e.target.value)}
                        />
                        <Dropdown
                          label="Quận / huyện"
                          value={district}
                          options={[
                            { value: "", label: "Tất cả quận/huyện" },
                            ...(catalog.data?.districts ?? [])
                              .filter((d) => d.provinceCode === province)
                              .map((d) => ({ value: d.code, label: d.name })),
                          ]}
                          onChange={setDistrict}
                        />
                      </div>
                      <Checkbox
                        label="Lọc theo lịch và số buổi mỗi tuần"
                        checked={scheduled}
                        onChange={setScheduled}
                      />
                      {scheduled && (
                        <fieldset className="space-y-3">
                          <legend className="font-semibold">
                            Lịch mong muốn (Asia/Ho_Chi_Minh)
                          </legend>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <TextField
                              label="Số buổi / tuần"
                              type="number"
                              min={1}
                              max={21}
                              step={1}
                              value={frequency}
                              onChange={(e) => setFrequency(e.target.value)}
                            />
                            <TextField
                              label="Thời lượng mỗi buổi (phút)"
                              type="number"
                              min={30}
                              max={240}
                              step={1}
                              value={duration}
                              onChange={(e) => setDuration(e.target.value)}
                            />
                          </div>
                          {windows.map((w, i) => (
                            <div
                              key={i}
                              className="grid items-end gap-3 sm:grid-cols-4"
                            >
                              <Dropdown
                                label={`Ngày ${i + 1}`}
                                value={String(w.dayOfWeek)}
                                options={days.map((label, index) => ({
                                  value: String(index + 1),
                                  label,
                                }))}
                                onChange={(value) =>
                                  setWindows(
                                    windows.map((old, index) =>
                                      index === i
                                        ? { ...old, dayOfWeek: Number(value) }
                                        : old
                                    )
                                  )
                                }
                              />
                              <TextField
                                label={`Bắt đầu ${i + 1}`}
                                type="time"
                                value={w.startTime}
                                onChange={(e) =>
                                  setWindows(
                                    windows.map((old, index) =>
                                      index === i
                                        ? { ...old, startTime: e.target.value }
                                        : old
                                    )
                                  )
                                }
                              />
                              <TextField
                                label={`Kết thúc ${i + 1}`}
                                type="time"
                                value={w.endTime}
                                onChange={(e) =>
                                  setWindows(
                                    windows.map((old, index) =>
                                      index === i
                                        ? { ...old, endTime: e.target.value }
                                        : old
                                    )
                                  )
                                }
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={windows.length <= 1}
                                onClick={() =>
                                  setWindows(
                                    windows.filter((_, index) => index !== i)
                                  )
                                }
                              >
                                Xóa khung {i + 1}
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={windows.length >= 50}
                            onClick={() =>
                              setWindows([
                                ...windows,
                                {
                                  dayOfWeek: 1,
                                  startTime: "18:00",
                                  endTime: "20:00",
                                },
                              ])
                            }
                          >
                            Thêm khung giờ
                          </Button>
                          <p className="text-sm text-content-secondary">
                            Khả năng đáp ứng dựa trên lịch đã khai báo, chưa trừ
                            lịch học đã chốt.
                          </p>
                        </fieldset>
                      )}
                    </div>
                  ),
                },
              ]}
            />
            {validation && (
              <p role="alert" className="text-status-error">
                {validation}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="brand">
                Áp dụng bộ lọc
              </Button>
              <Button type="button" variant="secondary" onClick={clearFilters}>
                Xóa tất cả bộ lọc
              </Button>
            </div>
          </form>
        </Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            aria-live="polite"
            className="text-sm font-semibold text-content-secondary"
          >
            {query.data && !query.isError && !query.isFetching
              ? `${query.data.totalCount} gia sư phù hợp`
              : "Danh sách gia sư"}
          </p>
          <div className="w-full sm:w-64">
            {" "}
            <Dropdown
              label="Sắp xếp"
              value={params.get("sort") ?? "newest"}
              options={[
                { value: "newest", label: "Mới duyệt nhất" },
                { value: "priceAsc", label: "Giá theo buổi tăng dần" },
                { value: "priceDesc", label: "Giá theo buổi giảm dần" },
              ]}
              onChange={(value) => {
                const next = new URLSearchParams(queryString);
                next.set("sort", value);
                next.delete("page");
                navigate(next);
              }}
            />
          </div>
        </div>
        {query.isFetching ? (
          <p role="status">Đang tải gia sư...</p>
        ) : query.isError ? (
          <Card>
            <p role="alert">
              {query.error instanceof ApiError && query.error.status === 400
                ? "Bộ lọc trên URL không hợp lệ. Hãy điều chỉnh hoặc xóa bộ lọc."
                : "Không thể tải danh sách gia sư."}
            </p>
            <Button variant="secondary" onClick={() => void query.refetch()}>
              Thử lại tìm kiếm
            </Button>
          </Card>
        ) : query.data ? (
          <>
            {query.data.items.length === 0 ? (
              <Card>
                <h2 className="font-semibold">Không tìm thấy gia sư phù hợp</h2>
                <p>Hãy bỏ bớt điều kiện hoặc xóa tất cả bộ lọc.</p>
              </Card>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {query.data.items.map((t) => (
                  <Card
                    key={t.id}
                    hoverable
                    padding="large"
                    className="flex h-full flex-col rounded-3xl border-border-default bg-surface-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="mb-5 flex items-center gap-3.5">
                      <Avatar
                        size="xlarge"
                        src={publicAvatarUrl(t.avatarUrl)}
                        alt={t.displayName}
                        fallbackText={t.displayName}
                        className="shrink-0 rounded-full border border-border-default"
                      />
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold">
                          {t.displayName}
                        </h2>
                        <p className="mt-1 line-clamp-2 text-sm text-content-secondary">
                          {[t.qualification, t.schoolName]
                            .filter(Boolean)
                            .join(" • ") || "Gia sư"}
                        </p>
                      </div>
                    </div>
                    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-brand/5 px-2.5 py-1 font-semibold text-brand">
                        {t.teachingModes
                          .map((m) => modeNames[m] ?? m)
                          .join(" / ") || "Chưa cập nhật hình thức"}
                      </span>
                      <span className="text-content-secondary">
                        Chưa có đánh giá
                      </span>
                    </div>
                    {(t.provinceName || t.districtName) && (
                      <p className="mb-2 text-sm text-content-secondary">
                        {[t.districtName, t.provinceName]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    <p className="mb-4 text-sm font-medium">
                      {t.experienceYears == null
                        ? "Chưa cập nhật kinh nghiệm"
                        : `${t.experienceYears} năm kinh nghiệm`}
                    </p>
                    <div className="mb-5 flex flex-wrap gap-1.5">
                      {t.subjects.map((subject) => (
                        <span
                          key={subject.subjectId}
                          className="rounded-full bg-surface-base px-2.5 py-1 text-xs text-content-secondary"
                        >
                          {subject.name}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border-default pt-4">
                      <p
                        className="font-bold"
                        aria-label={`${t.sessionRateVnd.toLocaleString("vi-VN")} VNĐ/buổi`}
                      >
                        <span className="block whitespace-nowrap text-lg">
                          {t.sessionRateVnd.toLocaleString("vi-VN")}đ
                        </span>
                        <span className="text-xs font-normal text-content-secondary">
                          Học phí theo buổi
                        </span>
                      </p>
                      <Button
                        asChild
                        variant="brand"
                        shape="pill"
                        className="shrink-0 whitespace-nowrap px-4"
                      >
                        <Link
                          href={`/tutors/${t.id}`}
                          aria-label={`Xem hồ sơ ${t.displayName}`}
                        >
                          Xem chi tiết
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            <nav
              aria-label="Phân trang gia sư"
              className="flex items-center gap-3"
            >
              <Button
                variant="secondary"
                disabled={query.data.page <= 1}
                onClick={() => page(query.data.page - 1)}
              >
                Trang trước
              </Button>
              <span>Trang {query.data.page}</span>
              <Button
                variant="secondary"
                disabled={
                  query.data.page * query.data.pageSize >= query.data.totalCount
                }
                onClick={() => page(query.data.page + 1)}
              >
                Trang sau
              </Button>
            </nav>
          </>
        ) : null}
      </div>
    </div>
  );
}
