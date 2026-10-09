import TutorNavbar from "@/components/navigation/TutorNavbar";
import { AuthGuard } from "@/components/AuthGuard";

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="TUTOR"><div className="min-h-screen flex flex-col bg-amber-50/20">
      <TutorNavbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div></AuthGuard>
  );
}
