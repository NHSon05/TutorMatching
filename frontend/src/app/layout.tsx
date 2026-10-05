import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-montserrat",
  display: "swap",
});

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
    <html lang="vi" className={`h-full antialiased ${montserrat.variable} ${montserrat.className}`}>
      <body className={`${montserrat.className} min-h-full flex flex-col font-sans`}>{children}</body>
    </html>
  );
}
