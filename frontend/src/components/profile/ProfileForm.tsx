"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AccountResponse } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { updateCurrentProfile, validateProfile, type UpdateProfileRequest } from "@/lib/api/profile";
import { sessionKey } from "@/lib/query/client";
import { useAuthStore } from "@/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";

type Errors = Partial<Record<keyof UpdateProfileRequest, string>>;

function fieldsFrom(account: AccountResponse): UpdateProfileRequest {
  return {
    fullName: account.fullName,
    phoneNumber: account.phoneNumber ?? null,
    dateOfBirth: account.dateOfBirth ?? null,
    avatarUrl: account.avatarUrl ?? null,
  };
}

export function ProfileForm({ account }: { account: AccountResponse }) {
  const client = useQueryClient();
  const [saved, setSaved] = useState(() => fieldsFrom(account));
  const [values, setValues] = useState(saved);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const mutation = useMutation({ mutationFn: updateCurrentProfile });
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  function change(field: keyof UpdateProfileRequest, value: string) {
    setValues(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
    setMessage("");
    setSuccess(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (mutation.isPending) return;
    setMessage("");
    setSuccess(false);
    const request = {
      fullName: values.fullName.trim(),
      phoneNumber: values.phoneNumber?.trim() || null,
      dateOfBirth: values.dateOfBirth || null,
      avatarUrl: values.avatarUrl?.trim() || null,
    };
    const validation = validateProfile(request);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    const session = client.getQueryData<AccountResponse | null>(sessionKey);
    try {
      const result = await mutation.mutateAsync(request);
      // A response from an old session must never restore private account state.
      if (!session || client.getQueryData(sessionKey) !== session || result.id !== session.id) return;
      await client.cancelQueries({ queryKey: sessionKey, exact: true });
      if (client.getQueryData(sessionKey) !== session) return;
      client.setQueryData(sessionKey, result);
      useAuthStore.getState().setAuth({ user: result });
      const next = fieldsFrom(result);
      setSaved(next);
      setValues(next);
      setSuccess(true);
      setMessage("Đã lưu thông tin cá nhân.");
      void client.invalidateQueries({ queryKey: ["tutor-profile", account.id] });
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors: Errors = {};
        for (const field of Object.keys(request) as (keyof UpdateProfileRequest)[]) {
          const entry = Object.entries(error.errors ?? {}).find(([key]) => key.toLowerCase() === field.toLowerCase());
          if (entry) fieldErrors[field] = entry[1].join(" ");
        }
        if (error.status === 409) fieldErrors.phoneNumber ??= "Số điện thoại này đã được sử dụng.";
        setErrors(fieldErrors);
        setMessage(error.status === 401 ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          : error.status === 403 ? "Bạn không có quyền cập nhật hồ sơ này."
          : error.status === 429 ? "Bạn thao tác quá nhanh. Vui lòng thử lại sau."
          : "Chưa thể lưu thay đổi. Vui lòng kiểm tra thông tin và thử lại.");
      } else {
        setMessage("Không thể kết nối máy chủ. Thông tin bạn nhập vẫn được giữ lại.");
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-bold text-content-primary">Thông tin cá nhân</h2>
        <p className="text-sm text-content-secondary">Thông tin liên hệ chỉ hiển thị trong tài khoản của bạn.</p>
      </CardHeader>
      <form onSubmit={submit} noValidate className="space-y-6">
        <fieldset disabled={mutation.isPending} className="grid min-w-0 gap-5 sm:grid-cols-2">
          <TextField label="Họ và tên" autoComplete="name" value={values.fullName} onChange={e => change("fullName", e.target.value)} error={errors.fullName} required maxLength={100} />
          <TextField label="Email" type="email" value={account.email} readOnly helperText="Email đăng nhập không thể thay đổi tại đây." />
          <TextField label="Số điện thoại" type="tel" autoComplete="tel" value={values.phoneNumber ?? ""} onChange={e => change("phoneNumber", e.target.value)} error={errors.phoneNumber} maxLength={32} placeholder="Thêm số điện thoại" />
          <TextField label="Ngày sinh" type="date" autoComplete="bday" value={values.dateOfBirth ?? ""} onChange={e => change("dateOfBirth", e.target.value)} error={errors.dateOfBirth} />
          <TextField className="sm:col-span-2" label="URL ảnh đại diện" value={values.avatarUrl ?? ""} onChange={e => change("avatarUrl", e.target.value)} error={errors.avatarUrl} maxLength={2048} placeholder="https://…" helperText="Dùng liên kết ảnh HTTP(S) hoặc đường dẫn ảnh đã tải lên. Để trống để dùng chữ cái tên bạn." />
        </fieldset>
        {message && <p role={success ? "status" : "alert"} className={`rounded-xl p-3 text-sm ${success ? "bg-status-success/10 text-status-success" : "bg-status-error/10 text-status-error"}`}>{message}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-default pt-5">
          <p className="text-xs text-content-secondary">{dirty ? "Bạn có thay đổi chưa lưu." : "Thông tin đang được đồng bộ với tài khoản."}</p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" disabled={!dirty || mutation.isPending} onClick={() => { setValues(saved); setErrors({}); setMessage(""); }}>Hủy thay đổi</Button>
            <Button type="submit" variant={account.role === "TUTOR" ? "tutor" : "brand"} disabled={!dirty} isLoading={mutation.isPending}>{mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}</Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
