import type { Metadata } from "next";
import { MathSubjectPage } from "@/components/subjects/MathSubjectPage";

export const metadata: Metadata = {
  title: "Gia sư Toán 1 kèm 1 | Edora",
  description:
    "Tìm gia sư Toán đã được xét duyệt cho mọi cấp học: Toán tư duy tiểu học, ôn thi vào 10, luyện thi THPT Quốc gia và Toán cao cấp.",
  alternates: { canonical: "/mon-hoc/toan-hoc" },
};

export default function MathSubjectRoute() {
  return <MathSubjectPage />;
}
