import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TutorMatching",
  description: "Nền tảng kết nối gia sư và học viên",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
