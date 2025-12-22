import { Fragment } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DRELine } from "@/pages/apps/controle-financeiro/utils/dreCalculations";
import { dreCalculations } from "@/pages/apps/controle-financeiro/utils/dreCalculations";
import { ViewType } from "@/pages/apps/controle-financeiro/constants/financialConstants";
import { DRETableRow } from "./DRETableRow";

interface DRETableProps {
  lines: DRELine[];
  columnLabels: string[];
  monthlyTotals: number[] | { year: number; totals: number[] }[];
  grandTotal: number;
  expandedLines: Set<string>;
  onToggleExpansion: (lineId: string) => void;
  onCellClick: (
    line: DRELine,
    periodIndex: number,
    columnLabel: string,
    selectedYear: number
  ) => void;
  viewType: ViewType;
  selectedYears: number[];
}

export function DRETable({
  lines,
  columnLabels,
  monthlyTotals,
  grandTotal,
  expandedLines,
  onToggleExpansion,
  onCellClick,
  viewType,
  selectedYears,
}: DRETableProps) {
  const visibleLines = lines.filter((line) =>
    dreCalculations.isLineVisible(line, expandedLines, lines)
  );

  const isMultiYear = selectedYears.length > 1;
  const multiYearTotals = isMultiYear
    ? (monthlyTotals as { year: number; totals: number[] }[])
    : [];

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {isMultiYear ? (
            <>
              <TableRow>
                <TableHead rowSpan={2} className="w-[300px] font-semibold border-r">
                  Descrição
                </TableHead>
                {selectedYears.map((year) => (
                  <TableHead
                    key={year}
                    colSpan={columnLabels.length + 1}
                    className="text-center font-bold text-base border-r bg-primary/5"
                  >
                    {year}
                  </TableHead>
                ))}
                <TableHead rowSpan={2} className="text-center font-semibold min-w-[120px]">
                  Total Geral
                </TableHead>
              </TableRow>
              <TableRow>
                {selectedYears.map((year) => (
                  <Fragment key={year}>
                    {columnLabels.map((label) => (
                      <TableHead key={`${year}-${label}`} className="text-center font-semibold min-w-[120px]">
                        {label}
                      </TableHead>
                    ))}
                    <TableHead key={`${year}-total`} className="text-center font-semibold min-w-[120px] border-r">
                      Total
                    </TableHead>
                  </Fragment>
                ))}
              </TableRow>
            </>
          ) : (
            <TableRow>
              <TableHead className="w-[300px] font-semibold">Descrição</TableHead>
              {columnLabels.map((label) => (
                <TableHead key={label} className="text-center font-semibold min-w-[120px]">
                  {label}
                </TableHead>
              ))}
              <TableHead className="text-center font-semibold min-w-[120px]">Total</TableHead>
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {visibleLines.map((line) => (
            <DRETableRow
              key={line.id}
              line={line}
              isExpanded={expandedLines.has(line.id)}
              onToggle={() => onToggleExpansion(line.id)}
              onCellClick={(periodIndex, columnLabel, year) =>
                onCellClick(line, periodIndex, columnLabel, year)
              }
              columnLabels={columnLabels}
              viewType={viewType}
              selectedYears={selectedYears}
            />
          ))}

          {/* Linha de TOTAL */}
          <TableRow className="bg-primary/10 font-bold border-t border-primary/30">
            <TableCell className="uppercase tracking-wide text-card-foreground border-r">
              Total
            </TableCell>
            {isMultiYear ? (
              <>
                {multiYearTotals.map((yearData) => (
                  <Fragment key={yearData.year}>
                    {yearData.totals.map((value, i) => (
                      <TableCell key={`${yearData.year}-${i}`} className="text-center">
                        <span
                          className={
                            value > 0
                              ? "text-success dark:text-success"
                              : value < 0
                                ? "text-destructive dark:text-destructive"
                                : "text-card-foreground/60"
                          }
                        >
                          {dreCalculations.formatCurrency(value)}
                        </span>
                      </TableCell>
                    ))}
                    <TableCell key={`${yearData.year}-total`} className="text-center border-r">
                      <span
                        className={
                          dreCalculations.calculateGrandTotal(yearData.totals) > 0
                            ? "text-success dark:text-success"
                            : dreCalculations.calculateGrandTotal(yearData.totals) < 0
                              ? "text-destructive dark:text-destructive"
                              : "text-card-foreground/60"
                        }
                      >
                        {dreCalculations.formatCurrency(
                          dreCalculations.calculateGrandTotal(yearData.totals)
                        )}
                      </span>
                    </TableCell>
                  </Fragment>
                ))}
              </>
            ) : (
              <>
                {(monthlyTotals as number[]).map((value, i) => (
                  <TableCell key={i} className="text-center">
                    <span
                      className={
                        value > 0
                          ? "text-success dark:text-success"
                          : value < 0
                            ? "text-destructive dark:text-destructive"
                            : "text-card-foreground/60"
                      }
                    >
                      {dreCalculations.formatCurrency(value)}
                    </span>
                  </TableCell>
                ))}
              </>
            )}
            <TableCell className="text-center">
              <span
                className={
                  grandTotal > 0
                    ? "text-success dark:text-success"
                    : grandTotal < 0
                      ? "text-destructive dark:text-destructive"
                      : "text-card-foreground/60"
                }
              >
                {dreCalculations.formatCurrency(grandTotal)}
              </span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
