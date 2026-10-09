import AdminSidebar from "@/components/navigation/AdminSidebar";
import { AuthGuard } from "@/components/AuthGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="ADMIN"><div className="min-h-screen flex bg-gray-100 text-gray-900 font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Hệ thống quản trị TutorMatching
          </span>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-medium text-gray-700">Admin Superuser</span>
          </div>
        </header>
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div></AuthGuard>
  );
}
