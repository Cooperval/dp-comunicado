import { useState, useMemo, useRef } from "react";
import { Board, Column, Card } from "@/pages/apps/fechamento/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  Link2, 
  LayoutGrid, 
  Calendar, 
  GitBranch, 
  CalendarCheck, 
  Download, 
  Image as ImageIcon, 
  FileText,
  AlertTriangle,
  User
} from "lucide-react";
import { format, eachDayOfInterval, differenceInDays, addDays, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getMinMaxDates } from "@/pages/apps/fechamento/lib/dateUtils";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface GanttChartProps {
  board: Board;
}

type GanttSortMode = 'status' | 'start-date' | 'dependency';

const ROW_HEIGHT = 44;
const CELL_WIDTH = 48;
const NAME_COLUMN_WIDTH = 256;

interface CardRowInfo {
  card: Card;
  column: Column;
  rowIndex: number;
  position: { start: number; span: number } | null;
}

interface DependencyConnection {
  fromCard: Card;
  toCard: Card;
  fromRowIndex: number;
  toRowIndex: number;
  fromPosition: { start: number; span: number };
  toPosition: { start: number; span: number };
}

interface CardWithColumn {
  card: Card;
  column: Column;
  dependencyLevel?: number;
}

// Helper to check if task is overdue
const isOverdue = (card: Card): boolean => {
  if (!card.endDate) return false;
  const progress = card.progress || 0;
  const today = startOfDay(new Date());
  const endDate = startOfDay(card.endDate);
  return endDate < today && progress < 100;
};

// Get dependency arrow color based on status
const getDependencyColor = (fromCard: Card): { stroke: string; fill: string; colorKey: string } => {
  const progress = fromCard.progress || 0;
  
  if (progress === 100) {
    return { stroke: '#10B981', fill: '#10B981', colorKey: 'green' };
  }
  
  if (isOverdue(fromCard)) {
    return { stroke: '#EF4444', fill: '#EF4444', colorKey: 'red' };
  }
  
  if (progress > 0) {
    return { stroke: '#3B82F6', fill: '#3B82F6', colorKey: 'blue' };
  }
  
  return { stroke: '#9CA3AF', fill: '#9CA3AF', colorKey: 'gray' };
};

// Card Tooltip Component
const CardTooltip = ({ card, column }: { card: Card; column: Column }) => {
  const overdue = isOverdue(card);
  const daysRemaining = card.endDate 
    ? differenceInDays(card.endDate, new Date()) 
    : null;
  const progress = card.progress || 0;
  
  return (
    <div className="space-y-2 max-w-xs">
      <div className="font-semibold text-foreground">{card.title}</div>
      {card.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{card.description}</p>
      )}
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Início:</span>
          <span className="ml-1 text-foreground">{card.startDate ? format(card.startDate, 'dd/MM/yyyy') : '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Término:</span>
          <span className="ml-1 text-foreground">{card.endDate ? format(card.endDate, 'dd/MM/yyyy') : '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Status:</span>
          <Badge variant="outline" className="ml-1 text-xs">{column.title}</Badge>
        </div>
        <div>
          <span className="text-muted-foreground">Progresso:</span>
          <span className="ml-1 text-foreground font-medium">{progress}%</span>
        </div>
      </div>
      
      {card.assignedTo && (
        <div className="flex items-center gap-2 text-xs text-foreground">
          <User className="w-3 h-3" />
          <span>{card.assignedTo.name}</span>
        </div>
      )}
      
      {overdue && (
        <div className="flex items-center gap-1 text-xs text-destructive font-medium">
          <AlertTriangle className="w-3 h-3" />
          <span>Atrasada há {Math.abs(daysRemaining || 0)} dia(s)</span>
        </div>
      )}
      
      {!overdue && daysRemaining !== null && daysRemaining > 0 && (
        <div className="text-xs text-muted-foreground">
          {daysRemaining} dia(s) restante(s)
        </div>
      )}
      
      {!overdue && daysRemaining === 0 && (
        <div className="text-xs text-warning font-medium">
          Vence hoje!
        </div>
      )}
    </div>
  );
};

export const GanttChart = ({ board }: GanttChartProps) => {
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set(board.columns.map(col => col.id)));
  const [sortMode, setSortMode] = useState<GanttSortMode>('status');
  const [viewStartDate, setViewStartDate] = useState<Date | null>(null);
  const [daysToShow, setDaysToShow] = useState<number>(0); // 0 = show all
  const ganttRef = useRef<HTMLDivElement>(null);

  // Get all cards with dates
  const cardsWithDates = useMemo(() => {
    const cards: CardWithColumn[] = [];
    board.columns.forEach(column => {
      column.cards.forEach(card => {
        if (card.startDate || card.endDate) {
          cards.push({ column, card });
        }
      });
    });
    return cards;
  }, [board.columns]);

  // Sort by start date
  const sortedByStartDate = useMemo(() => {
    return [...cardsWithDates].sort((a, b) => {
      const dateA = a.card.startDate || a.card.endDate || new Date();
      const dateB = b.card.startDate || b.card.endDate || new Date();
      return dateA.getTime() - dateB.getTime();
    });
  }, [cardsWithDates]);

  // Topological sort by dependency
  const sortedByDependency = useMemo(() => {
    const result: CardWithColumn[] = [];
    const visited = new Set<string>();
    const cardMap = new Map(cardsWithDates.map(c => [c.card.id, c]));
    const levelMap = new Map<string, number>();

    const calculateLevel = (cardInfo: CardWithColumn): number => {
      if (levelMap.has(cardInfo.card.id)) {
        return levelMap.get(cardInfo.card.id)!;
      }

      const deps = cardInfo.card.dependsOn || (cardInfo.card as any).dependencyIds || [];
      if (deps.length === 0) {
        levelMap.set(cardInfo.card.id, 0);
        return 0;
      }

      let maxDepLevel = 0;
      deps.forEach((depId: string) => {
        const depCard = cardMap.get(depId);
        if (depCard) {
          maxDepLevel = Math.max(maxDepLevel, calculateLevel(depCard) + 1);
        }
      });

      levelMap.set(cardInfo.card.id, maxDepLevel);
      return maxDepLevel;
    };

    // Calculate levels for all cards
    cardsWithDates.forEach(cardInfo => calculateLevel(cardInfo));

    const visit = (cardInfo: CardWithColumn) => {
      if (visited.has(cardInfo.card.id)) return;

      // First visit all dependencies
      const deps = cardInfo.card.dependsOn || (cardInfo.card as any).dependencyIds || [];
      deps.forEach((depId: string) => {
        const depCard = cardMap.get(depId);
        if (depCard) visit(depCard);
      });

      visited.add(cardInfo.card.id);
      result.push({ ...cardInfo, dependencyLevel: levelMap.get(cardInfo.card.id) || 0 });
    };

    // Sort by start date first to get consistent ordering within same level
    const sortedByDate = [...cardsWithDates].sort((a, b) => {
      const dateA = a.card.startDate || a.card.endDate || new Date();
      const dateB = b.card.startDate || b.card.endDate || new Date();
      return dateA.getTime() - dateB.getTime();
    });

    sortedByDate.forEach(visit);
    return result;
  }, [cardsWithDates]);

  // Calculate full date range from all cards
  const fullDateRange = useMemo(() => {
    const allDates: (Date | undefined)[] = [];
    cardsWithDates.forEach(({ card }) => {
      allDates.push(card.startDate, card.endDate);
    });
    
    const { min, max } = getMinMaxDates(allDates);
    return { min, max, days: eachDayOfInterval({ start: min, end: max }) };
  }, [cardsWithDates]);

  // Calculate visible date range based on navigation
  const dateRange = useMemo(() => {
    if (daysToShow === 0) {
      return fullDateRange.days;
    }
    
    const start = viewStartDate || startOfDay(new Date());
    const end = addDays(start, daysToShow - 1);
    return eachDayOfInterval({ start, end });
  }, [fullDateRange, viewStartDate, daysToShow]);

  // Navigation functions
  const navigatePrevious = () => {
    const step = daysToShow || 7;
    setViewStartDate(prev => subDays(prev || startOfDay(new Date()), step));
  };

  const navigateNext = () => {
    const step = daysToShow || 7;
    setViewStartDate(prev => addDays(prev || startOfDay(new Date()), step));
  };

  const navigateToday = () => {
    setViewStartDate(startOfDay(new Date()));
  };

  // Export functions
  const exportToPNG = async () => {
    if (!ganttRef.current) return;
    
    try {
      const canvas = await html2canvas(ganttRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `gantt-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({ title: 'Gantt exportado como PNG!' });
    } catch (error) {
      toast({ title: 'Erro ao exportar PNG', variant: 'destructive' });
    }
  };

  const exportToPDF = async () => {
    if (!ganttRef.current) return;
    
    try {
      const canvas = await html2canvas(ganttRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('l', 'pt', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, finalWidth, finalHeight);
      pdf.save(`gantt-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({ title: 'Gantt exportado como PDF!' });
    } catch (error) {
      toast({ title: 'Erro ao exportar PDF', variant: 'destructive' });
    }
  };

  const toggleColumn = (columnId: string) => {
    setExpandedColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  const getCardPosition = (card: Card) => {
    if (!card.startDate && !card.endDate) return null;
    
    const start = card.startDate || card.endDate!;
    const end = card.endDate || card.startDate!;
    
    const startIndex = dateRange.findIndex(date => 
      format(date, 'yyyy-MM-dd') === format(start, 'yyyy-MM-dd')
    );
    const endIndex = dateRange.findIndex(date => 
      format(date, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')
    );
    
    if (startIndex === -1 && endIndex === -1) return null;
    
    // Handle partial visibility
    const effectiveStart = startIndex === -1 ? 0 : startIndex;
    const effectiveEnd = endIndex === -1 ? dateRange.length - 1 : endIndex;
    
    return {
      start: effectiveStart,
      span: Math.max(1, effectiveEnd - effectiveStart + 1)
    };
  };

  // Get current card list based on sort mode
  const currentCardList = useMemo(() => {
    switch (sortMode) {
      case 'start-date':
        return sortedByStartDate;
      case 'dependency':
        return sortedByDependency;
      default:
        return cardsWithDates;
    }
  }, [sortMode, sortedByStartDate, sortedByDependency, cardsWithDates]);

  // Build card row mapping for dependency arrows (based on current view)
  const cardRowMapping = useMemo(() => {
    const mapping: CardRowInfo[] = [];
    let currentRowIndex = 0;

    if (sortMode === 'status') {
      board.columns.forEach(column => {
        const columnCards = column.cards.filter(card => card.startDate || card.endDate);
        if (columnCards.length === 0) return;

        currentRowIndex++;

        if (expandedColumns.has(column.id)) {
          columnCards.forEach(card => {
            mapping.push({
              card,
              column,
              rowIndex: currentRowIndex,
              position: getCardPosition(card)
            });
            currentRowIndex++;
          });
        }
      });
    } else {
      currentRowIndex++;
      
      currentCardList.forEach(({ card, column }) => {
        mapping.push({
          card,
          column,
          rowIndex: currentRowIndex,
          position: getCardPosition(card)
        });
        currentRowIndex++;
      });
    }

    return mapping;
  }, [board.columns, expandedColumns, dateRange, sortMode, currentCardList]);

  // Calculate dependency connections
  const dependencyConnections = useMemo(() => {
    const connections: DependencyConnection[] = [];

    cardRowMapping.forEach(({ card: toCard, rowIndex: toRowIndex, position: toPosition }) => {
      const deps = toCard.dependsOn || (toCard as any).dependencyIds || [];
      
      deps.forEach((depId: string) => {
        const fromInfo = cardRowMapping.find(info => info.card.id === depId);
        if (fromInfo && fromInfo.position && toPosition) {
          connections.push({
            fromCard: fromInfo.card,
            toCard,
            fromRowIndex: fromInfo.rowIndex,
            toRowIndex,
            fromPosition: fromInfo.position,
            toPosition
          });
        }
      });
    });

    return connections;
  }, [cardRowMapping]);

  // Calculate total height for SVG
  const totalRows = useMemo(() => {
    if (sortMode === 'status') {
      let rows = 0;
      board.columns.forEach(column => {
        const columnCards = column.cards.filter(card => card.startDate || card.endDate);
        if (columnCards.length === 0) return;
        rows++;
        if (expandedColumns.has(column.id)) {
          rows += columnCards.length;
        }
      });
      return rows;
    } else {
      return currentCardList.length + 1;
    }
  }, [board.columns, expandedColumns, sortMode, currentCardList]);

  const today = new Date();
  const todayIndex = dateRange.findIndex(date => 
    format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  );

  const hasDependencies = (card: Card) => {
    const deps = card.dependsOn || (card as any).dependencyIds || [];
    return deps.length > 0;
  };

  const getArrowPath = (conn: DependencyConnection) => {
    const startX = (conn.fromPosition.start + conn.fromPosition.span) * CELL_WIDTH;
    const endX = conn.toPosition.start * CELL_WIDTH;
    const startY = conn.fromRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
    const endY = conn.toRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

    if (endX <= startX + 20) {
      const midY = (startY + endY) / 2;
      const offset = 30;
      return `M ${startX} ${startY} 
              L ${startX + offset} ${startY}
              Q ${startX + offset + 10} ${startY} ${startX + offset + 10} ${startY + (endY > startY ? 10 : -10)}
              L ${startX + offset + 10} ${midY}
              Q ${startX + offset + 10} ${endY + (endY > startY ? -10 : 10)} ${startX + offset} ${endY}
              L ${endX - offset} ${endY}
              Q ${endX - offset - 10} ${endY} ${endX - offset - 10} ${endY + (endY > startY ? 10 : -10)}
              L ${endX - offset - 10} ${endY}
              L ${endX - 5} ${endY}`;
    }

    const controlOffset = Math.min(40, (endX - startX) / 3);
    return `M ${startX} ${startY} 
            C ${startX + controlOffset} ${startY} 
              ${endX - controlOffset} ${endY} 
              ${endX - 5} ${endY}`;
  };

  const getColumnTypeBadge = (column: Column) => {
    const type = column.closingColumnType;
    return {
      className: cn(
        "text-xs ml-2",
        type === 'todo' && "bg-amber-500/20 text-amber-600 border-amber-500/30",
        type === 'in-progress' && "bg-blue-500/20 text-blue-600 border-blue-500/30",
        type === 'done' && "bg-green-500/20 text-green-600 border-green-500/30"
      ),
      label: column.title
    };
  };

  // Get card background color with progress consideration
  const getCardColor = (card: Card) => {
    if (card.priority === 'high') return 'hsl(var(--destructive))';
    if (card.priority === 'medium') return 'hsl(var(--warning))';
    return 'hsl(var(--success))';
  };

  if (cardsWithDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">Nenhum card com datas definidas</p>
          <p className="text-sm">Adicione datas de início e término aos cards para visualizar o Gantt</p>
        </div>
      </div>
    );
  }

  const renderCardBar = (card: Card, column: Column, position: { start: number; span: number }) => {
    const progress = card.progress || 0;
    const overdue = isOverdue(card);
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "absolute top-2 h-8 rounded overflow-hidden flex items-center text-xs font-medium text-white shadow-md z-10 cursor-pointer hover:shadow-lg transition-all",
                overdue && "ring-2 ring-red-500 ring-offset-1 ring-offset-background animate-pulse"
              )}
              style={{
                left: `${position.start * CELL_WIDTH}px`,
                width: `${position.span * CELL_WIDTH}px`,
                backgroundColor: 'rgba(0,0,0,0.2)'
              }}
            >
              {/* Progress fill */}
              <div 
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${progress}%`,
                  backgroundColor: getCardColor(card)
                }}
              />
              
              {/* Overdue icon */}
              {overdue && (
                <AlertTriangle className="w-3 h-3 relative z-10 ml-1 flex-shrink-0" />
              )}
              
              {/* Title */}
              <span className="relative z-10 px-2 truncate flex-1">{card.title}</span>
              
              {/* Progress percentage */}
              <span className="relative z-10 mr-2 text-[10px] opacity-80 flex-shrink-0">
                {progress}%
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="p-3">
            <CardTooltip card={card} column={column} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderCardRow = ({ card, column, dependencyLevel }: CardWithColumn, index: number) => {
    const position = getCardPosition(card);
    if (!position) return null;

    const cardHasDeps = hasDependencies(card);
    const badgeInfo = getColumnTypeBadge(column);
    const overdue = isOverdue(card);

    return (
      <div key={card.id} className="flex hover:bg-muted/30 transition-colors">
        <div className="w-64 flex-shrink-0 p-3 border-r border-border">
          <div className="flex items-center space-x-2">
            {sortMode === 'dependency' && dependencyLevel !== undefined && (
              <span className="text-xs text-muted-foreground font-mono w-4">
                {dependencyLevel > 0 ? '└' : ''}
              </span>
            )}
            {overdue ? (
              <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0" />
            ) : cardHasDeps ? (
              <Link2 className="w-3 h-3 text-primary flex-shrink-0" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-primary/20 flex-shrink-0" />
            )}
            <span className={cn("text-sm truncate flex-1", overdue && "text-destructive")} title={card.title}>
              {card.title}
            </span>
            <Badge variant="outline" className={badgeInfo.className}>
              {badgeInfo.label}
            </Badge>
          </div>
        </div>
        <div className="flex-1 relative" style={{ height: `${ROW_HEIGHT}px` }}>
          <div className="absolute inset-0 flex">
            {dateRange.map((_, idx) => (
              <div
                key={idx}
                className="w-12 flex-shrink-0 border-r border-border/30"
              />
            ))}
          </div>
          {renderCardBar(card, column, position)}
        </div>
      </div>
    );
  };

  const zoomOptions = [
    { label: 'Todas', days: 0 },
    { label: '1 Semana', days: 7 },
    { label: '2 Semanas', days: 14 },
    { label: '1 Mês', days: 30 },
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="inline-block min-w-full" ref={ganttRef}>
        {/* Navigation and Controls Header */}
        <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/20 sticky top-0 z-30">
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={navigatePrevious} className="h-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateToday} className="h-8">
              <CalendarCheck className="w-4 h-4 mr-1" />
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={navigateNext} className="h-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom selector */}
          <Select value={String(daysToShow)} onValueChange={(v) => setDaysToShow(Number(v))}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {zoomOptions.map(opt => (
                <SelectItem key={opt.days} value={String(opt.days)}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range display */}
          <span className="text-sm text-muted-foreground">
            {format(dateRange[0], 'dd MMM', { locale: ptBR })} - {format(dateRange[dateRange.length - 1], 'dd MMM yyyy', { locale: ptBR })}
          </span>

          <div className="flex-1" />

          {/* Sort mode selector */}
          <span className="text-sm text-muted-foreground mr-2">Ordenar:</span>
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant={sortMode === 'status' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortMode('status')}
              className="h-7 text-xs"
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
              Situação
            </Button>
            <Button
              variant={sortMode === 'start-date' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortMode('start-date')}
              className="h-7 text-xs"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Data
            </Button>
            <Button
              variant={sortMode === 'dependency' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortMode('dependency')}
              className="h-7 text-xs"
            >
              <GitBranch className="w-3.5 h-3.5 mr-1.5" />
              Dep.
            </Button>
          </div>

          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToPNG}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Exportar como PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar como PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Badge variant="secondary" className="text-xs">
            {cardsWithDates.length} tarefas
          </Badge>
        </div>

        {/* Header with dates */}
        <div className="sticky top-[52px] z-20 bg-card border-b border-border">
          <div className="flex">
            <div className="w-64 flex-shrink-0 p-3 border-r border-border bg-muted/30 font-semibold">
              Tarefas
            </div>
            <div className="flex">
              {dateRange.map((date, index) => (
                <div
                  key={index}
                  className={`w-12 flex-shrink-0 p-2 border-r border-border text-center text-xs ${
                    index === todayIndex ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="font-semibold">{format(date, 'dd')}</div>
                  <div className="text-muted-foreground">{format(date, 'MMM', { locale: ptBR })}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gantt rows */}
        <div className="relative">
          {/* SVG overlay for dependency arrows */}
          <svg 
            className="absolute pointer-events-none z-30"
            style={{ 
              left: `${NAME_COLUMN_WIDTH}px`,
              top: 0,
              width: `${dateRange.length * CELL_WIDTH}px`,
              height: `${totalRows * ROW_HEIGHT}px`,
              overflow: 'visible'
            }}
          >
            <defs>
              {/* Colored arrowheads */}
              <marker 
                id="gantt-arrowhead-green" 
                markerWidth="8" 
                markerHeight="6" 
                refX="7" 
                refY="3" 
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#10B981" />
              </marker>
              <marker 
                id="gantt-arrowhead-red" 
                markerWidth="8" 
                markerHeight="6" 
                refX="7" 
                refY="3" 
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#EF4444" />
              </marker>
              <marker 
                id="gantt-arrowhead-blue" 
                markerWidth="8" 
                markerHeight="6" 
                refX="7" 
                refY="3" 
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#3B82F6" />
              </marker>
              <marker 
                id="gantt-arrowhead-gray" 
                markerWidth="8" 
                markerHeight="6" 
                refX="7" 
                refY="3" 
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#9CA3AF" />
              </marker>
            </defs>
            
            {dependencyConnections.map((conn, index) => {
              const colors = getDependencyColor(conn.fromCard);
              const isCompleted = colors.colorKey === 'green';
              
              return (
                <path
                  key={index}
                  d={getArrowPath(conn)}
                  fill="none"
                  stroke={colors.stroke}
                  strokeWidth="2"
                  strokeDasharray={isCompleted ? 'none' : '4 2'}
                  markerEnd={`url(#gantt-arrowhead-${colors.colorKey})`}
                  opacity="0.8"
                  className="transition-opacity hover:opacity-100"
                />
              );
            })}
          </svg>

          {/* Today line */}
          {todayIndex !== -1 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
              style={{ left: `${NAME_COLUMN_WIDTH + 8 + todayIndex * CELL_WIDTH + CELL_WIDTH / 2}px` }}
            />
          )}

          {/* Status view - grouped by columns */}
          {sortMode === 'status' && board.columns.map((column) => {
            const columnCards = column.cards.filter(card => card.startDate || card.endDate);
            if (columnCards.length === 0) return null;

            const isExpanded = expandedColumns.has(column.id);

            const columnDates: (Date | undefined)[] = [];
            columnCards.forEach(card => {
              columnDates.push(card.startDate, card.endDate);
            });
            const columnRange = getMinMaxDates(columnDates);
            const columnPosition = getCardPosition({
              ...columnCards[0],
              startDate: columnRange.min,
              endDate: columnRange.max
            });

            return (
              <div key={column.id} className="border-b border-border">
                <div className="flex hover:bg-muted/50 transition-colors">
                  <div className="w-64 flex-shrink-0 p-3 border-r border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleColumn(column.id)}
                      className="w-full justify-start p-0 h-auto font-medium"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 mr-2" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mr-2" />
                      )}
                      <span className="truncate">{column.title}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {columnCards.length}
                      </Badge>
                    </Button>
                  </div>
                  <div className="flex-1 relative" style={{ height: `${ROW_HEIGHT}px` }}>
                    <div className="absolute inset-0 flex">
                      {dateRange.map((_, index) => (
                        <div
                          key={index}
                          className="w-12 flex-shrink-0 border-r border-border/30"
                        />
                      ))}
                    </div>
                    {columnPosition && (
                      <div
                        className="absolute top-1 h-1 rounded-full bg-primary/20"
                        style={{
                          left: `${columnPosition.start * CELL_WIDTH}px`,
                          width: `${columnPosition.span * CELL_WIDTH}px`
                        }}
                      >
                        <div className="absolute -left-0.5 -top-1.5 w-1 h-4 rounded-full bg-primary/60" />
                        <div className="absolute -right-0.5 -top-1.5 w-1 h-4 rounded-full bg-primary/60" />
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && columnCards.map((card) => {
                  const position = getCardPosition(card);
                  if (!position) return null;

                  const cardHasDeps = hasDependencies(card);
                  const overdue = isOverdue(card);

                  return (
                    <div key={card.id} className="flex hover:bg-muted/30 transition-colors">
                      <div className="w-64 flex-shrink-0 p-3 border-r border-border">
                        <div className="flex items-center space-x-2">
                          {overdue ? (
                            <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0" />
                          ) : cardHasDeps ? (
                            <Link2 className="w-3 h-3 text-primary flex-shrink-0" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-primary/20 flex-shrink-0" />
                          )}
                          <span className={cn("text-sm truncate", overdue && "text-destructive")} title={card.title}>
                            {card.title}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 relative" style={{ height: `${ROW_HEIGHT}px` }}>
                        <div className="absolute inset-0 flex">
                          {dateRange.map((_, index) => (
                            <div
                              key={index}
                              className="w-12 flex-shrink-0 border-r border-border/30"
                            />
                          ))}
                        </div>
                        {renderCardBar(card, column, position)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Start Date view */}
          {sortMode === 'start-date' && (
            <div className="border-b border-border">
              <div className="flex bg-muted/30 p-3 border-b border-border">
                <div className="w-64 flex-shrink-0 font-semibold flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Todas as Tarefas (ordenadas por data)
                </div>
                <div className="flex-1 relative" style={{ height: `${ROW_HEIGHT - 24}px` }}>
                  <div className="absolute inset-0 flex">
                    {dateRange.map((_, index) => (
                      <div
                        key={index}
                        className="w-12 flex-shrink-0 border-r border-border/30"
                      />
                    ))}
                  </div>
                </div>
              </div>
              {sortedByStartDate.map((item, index) => renderCardRow(item, index))}
            </div>
          )}

          {/* Dependency view */}
          {sortMode === 'dependency' && (
            <div className="border-b border-border">
              <div className="flex bg-muted/30 p-3 border-b border-border">
                <div className="w-64 flex-shrink-0 font-semibold flex items-center">
                  <GitBranch className="w-4 h-4 mr-2" />
                  Fluxo de Dependências
                </div>
                <div className="flex-1 relative" style={{ height: `${ROW_HEIGHT - 24}px` }}>
                  <div className="absolute inset-0 flex">
                    {dateRange.map((_, index) => (
                      <div
                        key={index}
                        className="w-12 flex-shrink-0 border-r border-border/30"
                      />
                    ))}
                  </div>
                </div>
              </div>
              {sortedByDependency.map((item, index) => renderCardRow(item, index))}
            </div>
          )}

          {/* Enhanced Legend */}
          <div className="flex flex-wrap items-center gap-4 p-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            {/* Dependency arrow colors */}
            <div className="flex items-center gap-2">
              <svg width="24" height="12">
                <line x1="0" y1="6" x2="20" y2="6" stroke="#10B981" strokeWidth="2" />
                <polygon points="20,3 24,6 20,9" fill="#10B981" />
              </svg>
              <span>Concluída</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="24" height="12">
                <line x1="0" y1="6" x2="20" y2="6" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="20,3 24,6 20,9" fill="#3B82F6" />
              </svg>
              <span>Em andamento</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="24" height="12">
                <line x1="0" y1="6" x2="20" y2="6" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="20,3 24,6 20,9" fill="#EF4444" />
              </svg>
              <span>Atrasada</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="24" height="12">
                <line x1="0" y1="6" x2="20" y2="6" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="20,3 24,6 20,9" fill="#9CA3AF" />
              </svg>
              <span>Não iniciada</span>
            </div>
            
            <div className="w-px h-4 bg-border" />
            
            {/* Overdue indicator */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 rounded bg-destructive/50 ring-2 ring-red-500 ring-offset-1 ring-offset-background" />
              <span>Tarefa atrasada</span>
            </div>
            
            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="w-12 h-4 rounded overflow-hidden bg-muted">
                <div className="w-1/2 h-full bg-primary" />
              </div>
              <span>Progresso</span>
            </div>
            
            <div className="w-px h-4 bg-border" />
            
            {/* Priority colors */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded bg-destructive" />
              <span>Alta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded bg-warning" />
              <span>Média</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded bg-success" />
              <span>Baixa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
