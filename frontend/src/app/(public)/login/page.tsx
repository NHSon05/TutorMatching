import type { Metadata } from "next";
import LoginCard from "@/components/auth/LoginCard";
import { GuestGuard } from "@/components/GuestGuard";

export const metadata: Metadata = {
  title: "Đăng nhập | TutorMatching",
  description: "Đăng nhập vào hệ thống TutorMatching.",
};

export default function LoginPage() {
  return (
    <GuestGuard>
      <LoginCard />
    </GuestGuard>
  );
}
