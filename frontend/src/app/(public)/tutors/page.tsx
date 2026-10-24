import type { Metadata } from "next";
import TutorsListClient from "@/components/tutors/TutorsListClient";

export const metadata: Metadata = {
  title: "Danh Sách Gia Sư | TutorMatching",
  description: "Tìm kiếm gia sư chất lượng cao, uy tín và phù hợp nhất theo môn học, khu vực và trình độ.",
};

export default function TutorsPage() {
  return <TutorsListClient />;
}
