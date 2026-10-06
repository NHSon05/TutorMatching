import type { Metadata } from "next";
import LandingView from "@/components/landing/LandingView";

export const metadata: Metadata = {
  title: "TutorMatching - Nền tảng kết nối Gia sư 1 kèm 1",
  description: "Nền tảng kết nối 1 kèm 1 giữa Gia sư tài năng & Học sinh xuất sắc.",
  keywords: ["gia sư", "tìm gia sư", "gia sư 1 kèm 1", "học kèm tại nhà"],
  openGraph: {
    title: "TutorMatching - Nền tảng kết nối Gia sư 1 kèm 1",
    description: "Kết nối gia sư chất lượng cao nhanh chóng, an toàn.",
    url: "https://tutor-matching-psi.vercel.app/",
    siteName: "TutorMatching",
    images: [
      {
        url: "https://res.cloudinary.com/dmfgqfhga/image/upload/v1791256652/preview_sejjxq.png", // Ảnh preview khi share link
        width: 1200,
        height: 630,
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
};

export default function LandingPage() {
  return <LandingView />;
}
