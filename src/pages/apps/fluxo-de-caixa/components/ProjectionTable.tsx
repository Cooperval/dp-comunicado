import { Projection } from '@/pages/apps/fluxo-de-caixa/types/projection';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState, Fragment } from 'react';

interface ProjectionTableProps {
  projecao: Projection[];
  onEdit: (projection: Projection) => void;
  onDelete: (id: number) => void;
  onViewMonth: (data: {
    monthKey: string;
    projections: Projection[];
  }) => void;
}


const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function ProjectionTable({ onEdit, onDelete, projecao, onViewMonth }: ProjectionTableProps) {


  function groupProjectionsByMonth(data: Projection[]) {
    const map = new Map<string, Projection[]>();

    data.forEach(item => {
      const key = item.MES_PROJECAO; // ex: "2026-01"

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key)!.push(item);
    });

    // 🔽 Dentro do mês: mais antigo → mais recente
    map.forEach(list =>
      list.sort(
        (a, b) =>
          new Date(a.CRIADO).getTime() - new Date(b.CRIADO).getTime()
      )
    );

    // 🔽 Meses: ordem cronológica (yyyy-MM já ordena sozinho)
    return Array.from(map.entries()).sort(
      ([mesA], [mesB]) => mesA.localeCompare(mesB)
    );
  }






  const groupedProjections = groupProjectionsByMonth(projecao);


  const [openMonth, setOpenMonth] = useState<string | null>(null);

  function toggleMonth(monthKey: string) {
    setOpenMonth(prev => (prev === monthKey ? null : monthKey));
  }



  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableBody>
          {groupedProjections.map(([monthKey, projections]) => {
            const monthDate = new Date(projections[0].DATA_PROJECAO);

            return (
              <Fragment key={monthKey}>
                {/* TÍTULO DO MÊS */}
                <TableRow
                  className="bg-muted/60 cursor-pointer hover:bg-muted"
                  onClick={() => toggleMonth(monthKey)}
                >
                  <TableCell colSpan={10} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-3 items-center">
                        <span className="font-semibold">
                          {format(monthDate, 'MMMM/yyyy', { locale: ptBR })}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {projections.length} projeç{projections.length > 1 ? 'ões' : 'ão'}
                        </span>
                      </div>

                      <div className='gap-3 flex items-center'>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewMonth({ monthKey, projections });
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <span className="text-muted-foreground">
                          {openMonth === monthKey ? '▲' : '▼'}
                        </span>

                      </div>
                    </div>
                  </TableCell>
                </TableRow>

                {/* CABEÇALHO DO BLOCO */}
                {openMonth === monthKey && (
                  <TableRow className="bg-muted/30 text-xs font-semibold">
                    <TableCell className="text-center">ID</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell className="text-center">Urbana</TableCell>
                    <TableCell className="text-center">Rural</TableCell>
                    <TableCell className="text-center">Mercadão</TableCell>
                    <TableCell className="text-center">Agroenergia</TableCell>
                    <TableCell className="text-center">Pró-Labore</TableCell>
                    <TableCell className="text-center">Total</TableCell>
                    <TableCell className="text-center">Criado</TableCell>
                    <TableCell className="text-center">Ações</TableCell>
                  </TableRow>
                )}

                {/* DADOS */}
                {openMonth === monthKey &&
                  projections.map((projection) => (
                    <TableRow
                      key={projection.ID_PROJECAO}
                      className="hover:bg-muted/40"
                    >
                      <TableCell className="text-center">
                        {projection.ID_PROJECAO}
                      </TableCell>

                      <TableCell>
                        {format(new Date(projection.DATA_PROJECAO), 'dd/MM')}
                      </TableCell>

                      <TableCell className="text-center">
                        {formatCurrency(projection.URBANA)}
                      </TableCell>

                      <TableCell className="text-center">
                        {formatCurrency(projection.RURAL)}
                      </TableCell>

                      <TableCell className="text-center">
                        {formatCurrency(projection.MERCADAO)}
                      </TableCell>

                      <TableCell className="text-center">
                        {formatCurrency(projection.AGROENERGIA)}
                      </TableCell>

                      <TableCell className="text-center">
                        {formatCurrency(projection.PROLABORE)}
                      </TableCell>

                      <TableCell className="text-center font-bold">
                        {formatCurrency(projection.TOTAL)}
                      </TableCell>

                      <TableCell className="text-center">
                        {format(new Date(projection.CRIADO), 'dd/MM/yyyy')}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => onEdit(projection)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onDelete(projection.ID_PROJECAO)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </Fragment>
            );
          })}
        </TableBody>

      </Table>
    </div>
  );

}
