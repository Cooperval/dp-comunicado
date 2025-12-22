import { Project, Card } from "@/pages/apps/fechamento/types";
import { Card as UICard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CheckCircle2,
  DollarSign,
  Scale,
  MapPin,
  Calendar
} from "lucide-react";

interface DashboardStatsProps {
  projects: Project[];
  boards: Record<string, any>;
}

export const DashboardStats = ({ projects, boards }: DashboardStatsProps) => {
  // Calculate statistics
  const totalProjects = projects.length;
  const totalMembers = new Set(projects.flatMap(p => p.members.map(m => m.id))).size;
  
  // Get all cards from all boards
  const allCards = Object.values(boards).flatMap(board => 
    board.columns.flatMap((column: any) => column.cards)
  );
  
  const totalTasks = allCards.length;
  const completedTasks = Object.values(boards).reduce((count, board) => {
    const completedColumn = board.columns.find((col: any) => 
      col.title.toLowerCase().includes('concluído') || col.title.toLowerCase().includes('concluido')
    );
    return count + (completedColumn?.cards?.length || 0);
  }, 0);

  // Calculate values by type
  const valueStats = allCards.reduce((acc, card: Card) => {
    if (card.value && card.valueType) {
      if (!acc[card.valueType]) {
        acc[card.valueType] = { total: 0, count: 0 };
      }
      acc[card.valueType].total += card.value;
      acc[card.valueType].count += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'tons':
        return `${value.toLocaleString('pt-BR')} t`;
      case 'hectares':
        return `${value.toLocaleString('pt-BR')} ha`;
      case 'percentage':
        return `${value.toLocaleString('pt-BR')}%`;
      default:
        return value.toString();
    }
  };

  const getValueTypeIcon = (type: string) => {
    switch (type) {
      case 'currency':
        return <DollarSign className="w-5 h-5" />;
      case 'tons':
        return <Scale className="w-5 h-5" />;
      case 'hectares':
        return <MapPin className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getValueTypeName = (type: string) => {
    switch (type) {
      case 'currency':
        return 'Valor Monetário';
      case 'tons':
        return 'Toneladas';
      case 'hectares':
        return 'Hectares';
      case 'percentage':
        return 'Percentual';
      default:
        return type;
    }
  };

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    {
      title: 'Projetos Ativos',
      value: totalProjects,
      icon: <BarChart3 className="w-5 h-5 text-primary" />,
      description: 'Projetos em andamento'
    },
    {
      title: 'Taxa de Conclusão',
      value: `${completionRate}%`,
      icon: <CheckCircle2 className="w-5 h-5 text-success" />,
      description: `${completedTasks} de ${totalTasks} tarefas`
    },
    {
      title: 'Membros da Equipe',
      value: totalMembers,
      icon: <Users className="w-5 h-5 text-warning" />,
      description: 'Colaboradores ativos'
    },
    {
      title: 'Tarefas Totais',
      value: totalTasks,
      icon: <Calendar className="w-5 h-5 text-info" />,
      description: 'Todas as tarefas criadas'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <UICard key={index} className="p-6 gradient-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                {stat.icon}
              </div>
            </div>
          </UICard>
        ))}
      </div>

      {/* Value Type Stats */}
      {Object.keys(valueStats).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
            Valores por Categoria
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(valueStats).map(([type, data]) => (
              <UICard key={type} className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getValueTypeIcon(type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{getValueTypeName(type)}</p>
                    <p className="text-lg font-bold text-primary">
                      {formatValue((data as any).total, type)}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {(data as any).count} {(data as any).count === 1 ? 'tarefa' : 'tarefas'}
                    </Badge>
                  </div>
                </div>
              </UICard>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <UICard className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-primary" />
          Projetos Recentes
        </h3>
        
        <div className="space-y-3">
          {projects
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5)
            .map((project) => (
              <div key={project.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="font-medium text-foreground">{project.name}</p>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {project.members.length} {project.members.length === 1 ? 'membro' : 'membros'}
                  </Badge>
                </div>
              </div>
            ))}
        </div>
        
        {projects.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum projeto encontrado
          </p>
        )}
      </UICard>
    </div>
  );
};