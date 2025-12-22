import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Receipt, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { BankCashFlow, DailyCashFlow, DataKeyType } from "@/pages/apps/controle-financeiro/types/cashFlow";

interface CashFlowTableProps {
  bankData: BankCashFlow;
  bankId: string;
  bankName: string;
  onOpenDetails: (day: DailyCashFlow, type: DataKeyType) => void;
  formatCurrency: (value: number) => string;
}

export function CashFlowTable({
  bankData,
  bankId,
  bankName,
  onOpenDetails,
  formatCurrency,
}: CashFlowTableProps) {
  if (bankData.days.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma movimentação encontrada para este banco no período selecionado.
      </div>
    );
  }

  const renderDataRow = (
    label: string,
    icon: React.ReactNode,
    colorClass: string,
    dataKey: DataKeyType,
    totalValue: number
  ) => {
    return (
      <TableRow className="hover:bg-muted/50 transition-colors">
        <TableCell className={`font-medium ${colorClass}`}>
          <div className="flex items-center gap-2">
            {icon}
            <span>{label}</span>
          </div>
        </TableCell>
        {bankData.days.map((day) => {
          const hasItems = day[dataKey] > 0;
          return (
            <TableCell key={`${dataKey}-${day.date}`} className="text-center">
              {hasItems ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenDetails(day, dataKey)}
                  className={`h-auto p-1 font-medium ${colorClass} hover:${colorClass}/80 transition-all active:scale-95`}
                >
                  {formatCurrency(day[dataKey])}
                </Button>
              ) : (
                <span className="text-muted-foreground/30">-</span>
              )}
            </TableCell>
          );
        })}
        <TableCell className={`text-center font-bold ${colorClass} bg-muted/50`}>
          {formatCurrency(totalValue)}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="relative">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left font-semibold sticky left-0 bg-background z-10">Tipo</TableHead>
            {bankData.days.map((day) => (
              <TableHead key={`header-${day.date}`} className="text-center font-semibold min-w-[100px]">
                <div className="flex flex-col">
                  <span className="text-lg">{String(day.day).padStart(2, '0')}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {format(parseISO(day.date), "MMM", { locale: ptBR })}
                  </span>
                </div>
              </TableHead>
            ))}
            <TableHead className="text-center font-semibold min-w-[120px]">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {renderDataRow(
            "Entradas",
            <TrendingUp className="h-4 w-4" />,
            "text-green-600",
            "historicalIn",
            bankData.totalHistoricalIn
          )}

          {renderDataRow(
            "Saídas",
            <TrendingDown className="h-4 w-4" />,
            "text-red-600",
            "historicalOut",
            bankData.totalHistoricalOut
          )}

          {renderDataRow(
            "A Receber",
            <Receipt className="h-4 w-4" />,
            "text-green-500",
            "projectedIn",
            bankData.totalProjectedIn
          )}

          {renderDataRow(
            "A Pagar",
            <DollarSign className="h-4 w-4" />,
            "text-red-500",
            "projectedOut",
            bankData.totalProjectedOut
          )}

          {/* Linha de Saldo */}
          <TableRow className="bg-muted/50 font-semibold hover:bg-muted/70 transition-colors">
            <TableCell className="font-bold">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>Saldo</span>
              </div>
            </TableCell>
            {bankData.days.map((day) => (
              <TableCell
                key={`balance-${day.date}`}
                className={`text-center font-bold ${
                  day.closing > 0 ? "text-green-600" : day.closing < 0 ? "text-red-600" : "text-muted-foreground"
                }`}
              >
                {formatCurrency(Math.abs(day.closing))}
              </TableCell>
            ))}
            <TableCell
              className={`text-center font-bold ${
                bankData.totalClosing > 0
                  ? "text-green-600"
                  : bankData.totalClosing < 0
                  ? "text-red-600"
                  : "text-muted-foreground"
              } bg-muted`}
            >
              {formatCurrency(Math.abs(bankData.totalClosing))}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
