import { useState, useMemo } from "react";
import { Board, Column, Card } from "@/pages/apps/fechamento/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { format, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { getMinMaxDates, isDateInRange } from "@/pages/apps/fechamento/lib/dateUtils";

interface GanttChartProps {
  board: Board;
}

export const GanttChart = ({ board }: GanttChartProps) => {
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set(board.columns.map(col => col.id)));

  // Get all cards with dates
  const cardsWithDates = useMemo(() => {
    const cards: { column: Column; card: Card }[] = [];
    board.columns.forEach(column => {
      column.cards.forEach(card => {
        if (card.startDate || card.endDate) {
          cards.push({ column, card });
        }
      });
    });
    return cards;
  }, [board.columns]);

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

  const today = startOfDay(new Date());
  const todayIndex = dateRange.findIndex(date => 
    format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  );

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

  return (
    <div className="h-full overflow-auto">
      <div className="inline-block min-w-full">
        {/* Header with dates */}
        <div className="sticky top-0 z-10 bg-card border-b border-border">
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
          {/* Today line */}
          {todayIndex !== -1 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
              style={{ left: `${264 + todayIndex * 48 + 24}px` }}
            />
          )}

          {board.columns.map((column) => {
            const columnCards = column.cards.filter(card => card.startDate || card.endDate);
            if (columnCards.length === 0) return null;

            const isExpanded = expandedColumns.has(column.id);

            // Calculate column date range
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
                {/* Column header */}
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
                  <div className="flex-1 relative" style={{ height: '44px' }}>
                    {/* Column background grid */}
                    <div className="absolute inset-0 flex">
                      {dateRange.map((_, index) => (
                        <div
                          key={index}
                          className="w-12 flex-shrink-0 border-r border-border/30"
                        />
                      ))}
                    </div>
                    {/* Column date range indicator */}
                    {columnPosition && (
                      <div
                        className="absolute top-1 h-1 rounded-full bg-primary/20"
                        style={{
                          left: `${columnPosition.start * 48}px`,
                          width: `${columnPosition.span * 48}px`
                        }}
                      >
                        {/* Start marker */}
                        <div className="absolute -left-0.5 -top-1.5 w-1 h-4 rounded-full bg-primary/60" />
                        {/* End marker */}
                        <div className="absolute -right-0.5 -top-1.5 w-1 h-4 rounded-full bg-primary/60" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card rows */}
                {isExpanded && columnCards.map((card) => {
                  const position = getCardPosition(card);
                  if (!position) return null;

                  return (
                    <div key={card.id} className="flex hover:bg-muted/30 transition-colors">
                      <div className="w-64 flex-shrink-0 p-3 border-r border-border">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-primary/20" />
                          <span className="text-sm truncate" title={card.title}>
                            {card.title}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 relative" style={{ height: '44px' }}>
                        {/* Background grid */}
                        <div className="absolute inset-0 flex">
                          {dateRange.map((_, index) => (
                            <div
                              key={index}
                              className="w-12 flex-shrink-0 border-r border-border/30"
                            />
                          ))}
                        </div>
                        {/* Gantt bar */}
                        <div
                          className="absolute top-2 h-8 rounded flex items-center px-2 text-xs font-medium text-white shadow-md z-10 cursor-pointer hover:shadow-lg transition-shadow"
                          style={{
                            left: `${position.start * 48}px`,
                            width: `${position.span * 48}px`,
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
        </div>
      </div>
    </div>
  );
};
