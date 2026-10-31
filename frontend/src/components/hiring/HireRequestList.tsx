"use client";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import { useHireRequestList } from "@/hooks/use-hire-request-list";
import { formatVietnamDateTime } from "@/lib/date-time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, type TabOption } from "@/components/ui/tabs";
import { hireStatuses } from "./hire-status";

const statusTabs: TabOption[] = [
  { id: "", label: "Tất cả trạng thái" },
  ...Object.entries(hireStatuses).map(([value, info]) => ({
    id: value,
    label: info.label,
  })),
];

export function HireRequestList({
  audience,
}: {
  audience: "learner" | "tutor";
}) {
  const { data: account, isPending, isError } = useSession();
  if (isPending) return <p role="status">Đang kiểm tra phiên đăng nhập…</p>;
  if (isError || !account)
    return (
      <p role="alert">
        Không thể kiểm tra phiên đăng nhập. Vui lòng đăng nhập lại.
      </p>
    );
  return (
    <RequestListContent key={`${account.id}:${audience}`} audience={audience} />
  );
}
function RequestListContent({ audience }: { audience: "learner" | "tutor" }) {
  const list = useHireRequestList();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-neutral-900">
        Yêu cầu thuê gia sư
      </h1>
      <Tabs
        tabs={statusTabs}
        activeTab={list.status}
        onChange={list.changeStatus}
        roleVariant={audience === "tutor" ? "tutor" : "brand"}
        variant="line"
        className="mb-4"
      />
      {list.isPending && <p role="status">Đang tải danh sách yêu cầu…</p>}
      {list.isError && (
        <Card className="p-5 space-y-3">
          <p role="alert" className="text-status-error">
            Không thể tải danh sách yêu cầu thuê.
          </p>
          <Button variant="secondary" onClick={() => void list.refetch()}>
            Thử lại
          </Button>
        </Card>
      )}
      {!list.isPending && !list.isError && list.data?.items.length === 0 && (
        <p role="status">Không có yêu cầu nào phù hợp.</p>
      )}
      {!list.isError && list.data && (
        <ul aria-label="Danh sách yêu cầu" className="space-y-3">
          {list.data.items.map((item) => {
            const status = hireStatuses[item.status] ?? {
              label: item.status,
              variant: "gray" as const,
            };
            return (
              <li key={item.id}>
                <Card className="p-5 flex flex-wrap justify-between items-center gap-3">
                  <div className="space-y-2">
                    <p className="font-semibold">
                      {audience === "learner"
                        ? item.tutor.displayName
                        : item.learner.displayName}
                    </p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <p className="text-sm text-content-secondary">
                      Gửi lúc: {formatVietnamDateTime(item.createdAt)} • Mã:{" "}
                      {item.id}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant={audience === "tutor" ? "tutor" : "brand"}
                  >
                    <Link href={`/${audience}/requests/${item.id}`}>
                      Xem chi tiết →
                    </Link>
                  </Button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      <nav
        aria-label="Phân trang yêu cầu"
        className="flex flex-wrap items-center gap-3"
      >
        <Button
          variant="secondary"
          disabled={list.page === 1 || list.isFetching}
          onClick={list.previous}
        >
          Trang trước
        </Button>
        <span aria-live="polite">Trang {list.page}</span>
        <Button
          variant="secondary"
          disabled={!list.data?.nextCursor || list.isFetching || list.isError}
          onClick={list.next}
        >
          Tải trang tiếp theo
        </Button>
        {list.page > 1 && (
          <Button
            variant="secondary"
            disabled={list.isFetching}
            onClick={list.first}
          >
            Về trang đầu
          </Button>
        )}
      </nav>
    </section>
  );
}
