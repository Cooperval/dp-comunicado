import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { PortalSidebar } from './PortalSidebar';
import { ThemeToggle } from './ThemeToggle';

interface PortalLayoutProps {
  children: React.ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <PortalSidebar />
        <main className="flex-1 flex flex-col">
          <header className="flex justify-between items-center p-4 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          <div className="flex-1 p-4 sm:p-6 bg-gradient-subtle">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
