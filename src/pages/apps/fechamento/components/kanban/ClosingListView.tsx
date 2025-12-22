import { Column, Card } from "@/pages/apps/fechamento/types";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClosingListViewProps {
  columns: Column[];
  onCardClick: (card: Card) => void;
}

type CardWithColumn = Card & {
  columnTitle: string;
  columnColor?: string;
  columnTitleColor?: string;
};

export const ClosingListView = ({ columns, onCardClick }: ClosingListViewProps) => {
  // Flatten all cards with column info
  const allCards: CardWithColumn[] = columns.flatMap(col =>
    col.cards.map(card => ({
      ...card,
      columnTitle: col.title,
      columnColor: col.backgroundColor,
      columnTitleColor: col.titleColor
    }))
  );

  const formatValue = (value: number | undefined, valueType: Card['valueType']) => {
    if (value === undefined || value === null) return '-';
    
    switch (valueType) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      case 'tons':
        return `${value.toLocaleString('pt-BR')} t`;
      case 'hectares':
        return `${value.toLocaleString('pt-BR')} ha`;
      case 'percentage':
        return `${value.toLocaleString('pt-BR')}%`;
      default:
        return value.toLocaleString('pt-BR');
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getDependencyNames = (dependsOn: string[] | undefined, cards: CardWithColumn[]) => {
    if (!dependsOn || dependsOn.length === 0) return '-';
    
    const dependencyNames = dependsOn
      .map(id => cards.find(c => c.id === id)?.title)
      .filter(Boolean);
    
    return dependencyNames.length > 0 ? dependencyNames.join(', ') : '-';
  };

  const getPriorityBadge = (priority: Card['priority']) => {
    const config = {
      low: { label: 'Baixa', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      medium: { label: 'Média', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      high: { label: 'Alta', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    };
    return config[priority] || config.medium;
  };

  if (allCards.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">Nenhuma tarefa cadastrada</p>
          <p className="text-sm">Clique em "Nova Tarefa" para adicionar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Tarefa</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Prioridade</TableHead>
            <TableHead className="font-semibold">Responsável</TableHead>
            <TableHead className="font-semibold text-right">Valor</TableHead>
            <TableHead className="font-semibold">Início</TableHead>
            <TableHead className="font-semibold">Fim</TableHead>
            <TableHead className="font-semibold text-center">Duração</TableHead>
            <TableHead className="font-semibold">Depende de</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allCards.map(card => {
            const priorityConfig = getPriorityBadge(card.priority);
            
            return (
              <TableRow 
                key={card.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onCardClick(card)}
              >
                <TableCell className="font-medium max-w-[200px]">
                  <span className="truncate block" title={card.title}>
                    {card.title}
                  </span>
                  {card.description && (
                    <span className="text-xs text-muted-foreground truncate block" title={card.description}>
                      {card.description}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    className="whitespace-nowrap"
                    style={{ 
                      backgroundColor: card.columnColor,
                      color: card.columnTitleColor
                    }}
                  >
                    {card.columnTitle}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={priorityConfig.className}>
                    {priorityConfig.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {card.assignedTo?.name || '-'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatValue(card.value, card.valueType)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(card.startDate)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(card.endDate)}
                </TableCell>
                <TableCell className="text-center">
                  {card.duration ? `${card.duration}d` : '-'}
                </TableCell>
                <TableCell className="max-w-[150px]">
                  <span className="truncate block text-muted-foreground" title={getDependencyNames(card.dependsOn, allCards)}>
                    {getDependencyNames(card.dependsOn, allCards)}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
