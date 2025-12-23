import { useState, useMemo } from "react";
import { Board, Column, Card } from "@/pages/apps/fechamento/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Link2, LayoutGrid, Calendar, GitBranch } from "lucide-react";
import { format, eachDayOfInterval } from "date-fns";
import { getMinMaxDates } from "@/pages/apps/fechamento/lib/dateUtils";
import { cn } from "@/lib/utils";

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

export const GanttChart = ({ board }: GanttChartProps) => {
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set(board.columns.map(col => col.id)));
  const [sortMode, setSortMode] = useState<GanttSortMode>('status');

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

  // Calculate date range
  const dateRange = useMemo(() => {
    const allDates: (Date | undefined)[] = [];
    cardsWithDates.forEach(({ card }) => {
      allDates.push(card.startDate, card.endDate);
    });
    
    const { min, max } = getMinMaxDates(allDates);
    return eachDayOfInterval({ start: min, end: max });
  }, [cardsWithDates]);

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
    
    if (startIndex === -1 || endIndex === -1) return null;
    
    return {
      start: startIndex,
      span: Math.max(1, endIndex - startIndex + 1)
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

  const renderCardRow = ({ card, column, dependencyLevel }: CardWithColumn, index: number) => {
    const position = getCardPosition(card);
    if (!position) return null;

    const cardHasDeps = hasDependencies(card);
    const badgeInfo = getColumnTypeBadge(column);

    return (
      <div key={card.id} className="flex hover:bg-muted/30 transition-colors">
        <div className="w-64 flex-shrink-0 p-3 border-r border-border">
          <div className="flex items-center space-x-2">
            {sortMode === 'dependency' && dependencyLevel !== undefined && (
              <span className="text-xs text-muted-foreground font-mono w-4">
                {dependencyLevel > 0 ? '└' : ''}
              </span>
            )}
            {cardHasDeps ? (
              <Link2 className="w-3 h-3 text-primary flex-shrink-0" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-primary/20 flex-shrink-0" />
            )}
            <span className="text-sm truncate flex-1" title={card.title}>
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
          <div
            className="absolute top-2 h-8 rounded flex items-center px-2 text-xs font-medium text-white shadow-md z-10 cursor-pointer hover:shadow-lg transition-shadow"
            style={{
              left: `${position.start * CELL_WIDTH}px`,
              width: `${position.span * CELL_WIDTH}px`,
              backgroundColor: card.priority === 'high' 
                ? 'hsl(var(--destructive))' 
                : card.priority === 'medium' 
                ? 'hsl(var(--warning))' 
                : 'hsl(var(--success))'
            }}
            title={`${card.title}\n${card.startDate ? format(card.startDate, 'dd/MM/yyyy') : ''} - ${card.endDate ? format(card.endDate, 'dd/MM/yyyy') : ''}`}
          >
            <span className="truncate">{card.title}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto">
      <div className="inline-block min-w-full">
        {/* Sort mode selector */}
        <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/20 sticky top-0 z-30">
          <span className="text-sm text-muted-foreground mr-2">Ordenar por:</span>
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
              Data de Início
            </Button>
            <Button
              variant={sortMode === 'dependency' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortMode('dependency')}
              className="h-7 text-xs"
            >
              <GitBranch className="w-3.5 h-3.5 mr-1.5" />
              Dependência
            </Button>
          </div>
          <Badge variant="secondary" className="ml-auto text-xs">
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
                  <div className="text-muted-foreground">{format(date, 'MMM')}</div>
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
              <marker 
                id="gantt-arrowhead" 
                markerWidth="8" 
                markerHeight="6" 
                refX="7" 
                refY="3" 
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--primary))" />
              </marker>
            </defs>
            
            {dependencyConnections.map((conn, index) => (
              <path
                key={index}
                d={getArrowPath(conn)}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="4 2"
                markerEnd="url(#gantt-arrowhead)"
                opacity="0.7"
                className="transition-opacity hover:opacity-100"
              />
            ))}
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

                  return (
                    <div key={card.id} className="flex hover:bg-muted/30 transition-colors">
                      <div className="w-64 flex-shrink-0 p-3 border-r border-border">
                        <div className="flex items-center space-x-2">
                          {cardHasDeps ? (
                            <Link2 className="w-3 h-3 text-primary flex-shrink-0" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-primary/20 flex-shrink-0" />
                          )}
                          <span className="text-sm truncate" title={card.title}>
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
                        <div
                          className="absolute top-2 h-8 rounded flex items-center px-2 text-xs font-medium text-white shadow-md z-10 cursor-pointer hover:shadow-lg transition-shadow"
                          style={{
                            left: `${position.start * CELL_WIDTH}px`,
                            width: `${position.span * CELL_WIDTH}px`,
                            backgroundColor: card.priority === 'high' 
                              ? 'hsl(var(--destructive))' 
                              : card.priority === 'medium' 
                              ? 'hsl(var(--warning))' 
                              : 'hsl(var(--success))'
                          }}
                          title={`${card.title}\n${card.startDate ? format(card.startDate, 'dd/MM/yyyy') : ''} - ${card.endDate ? format(card.endDate, 'dd/MM/yyyy') : ''}`}
                        >
                          <span className="truncate">{card.title}</span>
                        </div>
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

          {/* Legend */}
          <div className="flex items-center gap-6 p-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg width="24" height="12">
                <line x1="0" y1="6" x2="20" y2="6" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="20,3 24,6 20,9" fill="hsl(var(--primary))" />
              </svg>
              <span>Dependência</span>
            </div>
            <div className="flex items-center gap-2">
              <Link2 className="w-3 h-3 text-primary" />
              <span>Tem antecessora</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded bg-destructive" />
              <span>Alta prioridade</span>
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