import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/ui/page-header";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  className?: string;
}

export function DashboardLayout({ children, title, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64">
        <PageHeader title={title} />
        <main className={cn("flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}