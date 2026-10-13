import type { Metadata } from "next";
import RegisterCard from "@/components/auth/RegisterCard";
import { GuestGuard } from "@/components/GuestGuard";

export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Bắt đầu tạo tài khoản.",
};

export default function RegisterPage() {
  return (
    <GuestGuard>
      <RegisterCard />
    </GuestGuard>
  );
}
