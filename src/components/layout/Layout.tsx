import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-gradient-subtle">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="flex justify-end items-center p-4 border-b border-border bg-background/50 backdrop-blur-sm">
          <ThemeToggle />
        </header>
        <div className="flex-1 p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}