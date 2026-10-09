import SharedNavbar from "@/components/navigation/SharedNavbar";
import { AuthGuard } from "@/components/AuthGuard";

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard><div className="min-h-screen flex flex-col bg-gray-50">
      <SharedNavbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div></AuthGuard>
  );
}
