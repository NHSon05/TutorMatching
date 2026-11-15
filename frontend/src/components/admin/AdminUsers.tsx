"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedAccount } from "@/hooks/use-authenticated-account";
import {
  ADMIN_USERS_QUERY_MAX,
  getAdminUser,
  searchAdminUsers,
  type AdminUser,
  type AdminUserRole,
  type AdminUserTargetStatus,
} from "@/lib/api/admin-users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { SearchField } from "@/components/ui/search-field";
import { UserStatusDialog } from "./UserStatusDialog";

const PAGE_SIZE = 20;
const ROLE_LABELS: Record<AdminUserRole, string> = {
  LEARNER: "Học viên",
  TUTOR: "Gia sư",
  ADMIN: "Quản trị viên",
};
const ROLE_OPTIONS = [
  { value: "", label: "Tất cả vai trò" },
  ...Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
];
const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "LOCKED", label: "Đã khóa" },
];

function StatusBadge({ status }: { status: AdminUser["status"] }) {
  if (status === "ACTIVE")
    return (
      <Badge variant="success" dot size="small">
        Hoạt động
      </Badge>
    );
  if (status === "LOCKED")
    return (
      <Badge variant="error" dot size="small">
        Đã khóa
      </Badge>
    );
  return (
    <Badge variant="gray" dot size="small">
      Không hoạt động
    </Badge>
  );
}

export default function AdminUsers() {
  const account = useAuthenticatedAccount();
  return <AdminUsersPanel key={account.id} accountId={account.id} />;
}

export function AdminUsersPanel({ accountId }: { accountId: string }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState<AdminUserRole | "">("");
  const [status, setStatus] = useState<AdminUserTargetStatus | "">("");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string>();
  const [statusTarget, setStatusTarget] = useState<AdminUser>();

  const list = useQuery({
    queryKey: ["admin-users", accountId, { q, role, status, page }],
    queryFn: ({ signal }) =>
      searchAdminUsers(
        {
          q,
          role: role || undefined,
          status: status || undefined,
          page,
          pageSize: PAGE_SIZE,
        },
        signal
      ),
  });
  const detail = useQuery({
    queryKey: ["admin-user", accountId, detailId],
    queryFn: ({ signal }) => getAdminUser(detailId!, signal),
    enabled: Boolean(detailId),
  });

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-users", accountId] }),
      queryClient.invalidateQueries({ queryKey: ["admin-user", accountId] }),
    ]);

  const openStatus = (user: AdminUser) => {
    if (user.id === accountId) return;
    setStatusTarget(user);
  };

  const totalPages = list.data
    ? Math.max(1, Math.ceil(list.data.totalCount / list.data.pageSize))
    : 1;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-content-primary">
          Quản lý tài khoản
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          Tìm kiếm, xem và khóa hoặc mở khóa tài khoản. Mọi thay đổi đều được
          ghi nhật ký kiểm toán.
        </p>
      </header>

      <Card padding="small">
        <div className="grid gap-3 md:grid-cols-[1fr_200px_200px]">
          <SearchField
            aria-label="Tìm theo tên hoặc email"
            placeholder="Tìm theo tên hoặc email"
            value={draft}
            maxLength={ADMIN_USERS_QUERY_MAX}
            onChange={(event) => setDraft(event.target.value)}
            onSearch={(value) => {
              setQ(value.trim());
              setPage(1);
            }}
            onClear={() => setDraft("")}
            isFullWidth
          />
          <Dropdown
            id="admin-users-role"
            options={ROLE_OPTIONS}
            value={role}
            onChange={(value) => {
              setRole(value as AdminUserRole | "");
              setPage(1);
            }}
            placeholder="Tất cả vai trò"
            isFullWidth
          />
          <Dropdown
            id="admin-users-status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(value) => {
              setStatus(value as AdminUserTargetStatus | "");
              setPage(1);
            }}
            placeholder="Tất cả trạng thái"
            isFullWidth
          />
        </div>
      </Card>

      {list.isPending ? (
        <p role="status">Đang tải danh sách tài khoản...</p>
      ) : list.isError ? (
        <Card>
          <p role="alert">Không thể tải danh sách tài khoản.</p>
          <Button onClick={() => void list.refetch()}>Thử lại</Button>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-default bg-gray-50 text-xs uppercase text-content-secondary">
                <tr>
                  <th className="px-4 py-3">Tên</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {list.data.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-content-secondary"
                    >
                      Không tìm thấy tài khoản phù hợp.
                    </td>
                  </tr>
                ) : (
                  list.data.items.map((user) => {
                    const self = user.id === accountId;
                    return (
                      <tr key={user.id}>
                        <td className="px-4 py-3 font-semibold text-content-primary">
                          {user.fullName}
                          {self && (
                            <span className="ml-2 text-xs font-normal text-content-secondary">
                              (bạn)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-content-secondary">
                          {user.email}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={user.role === "ADMIN" ? "admin" : "gray"}
                            size="small"
                          >
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={user.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="tertiary"
                              size="small"
                              aria-label={`Xem chi tiết ${user.fullName}`}
                              onClick={() => setDetailId(user.id)}
                            >
                              Chi tiết
                            </Button>
                            <StatusActionButton
                              user={user}
                              self={self}
                              onClick={() => openStatus(user)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border-default px-4 py-3 text-sm">
            <span className="text-content-secondary">
              {list.data.totalCount} tài khoản · Trang {page}/{totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="tertiary"
                size="small"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trang trước
              </Button>
              <Button
                variant="tertiary"
                size="small"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </Button>
            </div>
          </div>
        </Card>
      )}

      {detailId && !statusTarget && (
        <Dialog
          isOpen
          onClose={() => setDetailId(undefined)}
          title="Chi tiết tài khoản"
          maxWidth="lg"
        >
          {detail.isPending ? (
            <p role="status">Đang tải chi tiết...</p>
          ) : detail.isError ? (
            <div className="space-y-2">
              <p role="alert">Không thể tải chi tiết tài khoản.</p>
              <Button size="small" onClick={() => void detail.refetch()}>
                Thử lại
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-content-secondary">Họ tên</dt>
                <dd className="font-semibold">{detail.data.fullName}</dd>
                <dt className="text-content-secondary">Email</dt>
                <dd>{detail.data.email}</dd>
                <dt className="text-content-secondary">Vai trò</dt>
                <dd>{ROLE_LABELS[detail.data.role]}</dd>
                <dt className="text-content-secondary">Trạng thái</dt>
                <dd>
                  <StatusBadge status={detail.data.status} />
                </dd>
                {detail.data.tutorProfileId && (
                  <>
                    <dt className="text-content-secondary">Hồ sơ gia sư</dt>
                    <dd>{detail.data.tutorProfileStatus}</dd>
                  </>
                )}
              </dl>
              <div className="flex justify-end">
                <StatusActionButton
                  user={detail.data}
                  self={detail.data.id === accountId}
                  onClick={() => openStatus(detail.data)}
                />
              </div>
            </div>
          )}
        </Dialog>
      )}

      {statusTarget && (
        <UserStatusDialog
          key={`${statusTarget.id}:${statusTarget.version}`}
          user={statusTarget}
          onClose={() => setStatusTarget(undefined)}
          onChanged={(updated) => {
            queryClient.setQueryData(
              ["admin-user", accountId, updated.id],
              updated
            );
            setStatusTarget(undefined);
            void refresh();
          }}
          onStale={async () => {
            const fresh = await queryClient
              .fetchQuery({
                queryKey: ["admin-user", accountId, statusTarget.id],
                queryFn: ({ signal }) => getAdminUser(statusTarget.id, signal),
                staleTime: 0,
              })
              .catch(() => undefined);
            void refresh();
            setStatusTarget(
              fresh && fresh.status !== "INACTIVE" ? fresh : undefined
            );
          }}
        />
      )}
    </div>
  );
}

function StatusActionButton({
  user,
  self,
  onClick,
}: {
  user: AdminUser;
  self: boolean;
  onClick: () => void;
}) {
  if (user.status === "INACTIVE") return null;
  const locked = user.status === "LOCKED";
  return (
    <Button
      variant={locked ? "success" : "danger"}
      size="small"
      disabled={self}
      title={self ? "Không thể khóa tài khoản của chính bạn" : undefined}
      aria-label={`${locked ? "Mở khóa" : "Khóa"} ${user.fullName}`}
      onClick={onClick}
    >
      {locked ? "Mở khóa" : "Khóa"}
    </Button>
  );
}
