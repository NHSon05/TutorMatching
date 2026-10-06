import type { Metadata } from "next";
import RegisterCard from "@/components/auth/RegisterCard";

export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Bắt đầu tạo tài khoản.",
};

export default function RegisterPage() {
  return <RegisterCard />;
}
