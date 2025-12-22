import { User, Users, Settings, BarChart3, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface SidebarProps {
  currentUser: {
    name: string;
    role: UserRole;
  };
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  collaborator: 'Colaborador'
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: <Settings className="w-4 h-4" />,
  manager: <BarChart3 className="w-4 h-4" />,
  collaborator: <User className="w-4 h-4" />
};

export const Sidebar = ({ currentUser, activeSection, onSectionChange }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'projects', label: 'Projetos', icon: <Leaf className="w-5 h-5" /> },
    { id: 'team', label: 'Equipe', icon: <Users className="w-5 h-5" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="w-64 gradient-earth border-r border-sidebar-border p-6 animate-slide-in-left">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sidebar-primary">SugarFlow</h1>
              <p className="text-sm text-sidebar-foreground/70">Gestão Sucroenergética</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* User Info */}
      <div className="mb-8 p-4 bg-card/40 backdrop-blur-sm rounded-xl border border-border/30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-card-foreground">{currentUser.name}</p>
            <div className={cn(
              "inline-flex items-center space-x-1 text-xs px-2 py-1 rounded-full font-medium",
              currentUser.role === 'admin' && "hierarchy-admin",
              currentUser.role === 'manager' && "hierarchy-manager",
              currentUser.role === 'collaborator' && "hierarchy-collaborator"
            )}>
              {roleIcons[currentUser.role]}
              <span>{roleLabels[currentUser.role]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-organic text-left",
              activeSection === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="text-xs text-sidebar-foreground/50 text-center">
          <p>SugarFlow v1.0</p>
          <p>Setor Sucroenergético</p>
        </div>
      </div>
    </div>
  );
};