import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GiasuHome - Nền tảng kết nối gia sư 1 kèm 1",
  description:
    "Giasuhome.vn - Nền tảng kết nối gia sư 1 kèm 1. Kết nối gia sư giỏi và học viên trên toàn quốc. Đáp ứng mọi nhu cầu học tập của học sinh.",
  icons: {
    icon: "https://giasuhome.vn/lib/image/icon_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased scroll-smooth">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans text-[#1D1D1D] bg-white antialiased">
        {children}
      </body>
    </html>
  );
}
