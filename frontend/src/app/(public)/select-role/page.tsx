import type { Metadata } from "next";
import SelectRoleCard from "@/components/auth/SelectRoleCard";

export const metadata: Metadata = {
  title: "Chọn vai trò - TutorMatching",
  description: "Chọn vai trò tài khoản của bạn để tiếp tục trải nghiệm.",
};

export default function SelectRolePage() {
  return <SelectRoleCard />;
}
