import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  // Resolves relative canonical/Open Graph URLs against the public domain.
  metadataBase: new URL(SITE_URL),
  title: "Edora",
  description: "Nền tảng kết nối gia sư và học viên",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
