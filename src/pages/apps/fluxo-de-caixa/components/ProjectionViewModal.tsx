import { Projection } from '@/pages/apps/fluxo-de-caixa/types/projection';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';



interface ProjectionViewModalProps {
    open: boolean;
    onClose: () => void;
    monthLabel: string;
    projections: Projection[];
}


export function ProjectionViewModal({
    open,
    onClose,
    monthLabel,
    projections,
}: ProjectionViewModalProps) {
    if (!projections.length) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Projeções — {monthLabel}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[60vh] overflow-auto pr-1">
                    {projections.map((projection) => (
                        <div
                            key={projection.ID_PROJECAO}
                            className={`
    rounded-lg border shadow-sm
    ${projection.TIPO === 2
      ? 'bg-green-50 border-green-300'
      : 'bg-background'}
  `}
                        >
                            {/* Cabeçalho */}
                            <div className="px-4 py-2 border-b text-sm font-semibold text-muted-foreground">
                                {format(
                                    new Date(projection.DATA_PROJECAO),
                                    'dd/MM/yyyy',
                                    { locale: ptBR }
                                )}
                            </div>
                            <div className="px-4 py-2 border-b text-sm font-bold text-muted-foreground">
                                {projection.TIPO_TEXTO}
                            </div>

                            {/* Corpo */}
                            <div className="px-4 py-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm">
                                <Item label="Urbana" value={projection.URBANA} />
                                <Item label="Rural" value={projection.RURAL} />
                                <Item label="Mercadão" value={projection.MERCADAO} />
                                <Item label="Agroenergia" value={projection.AGROENERGIA} />
                                <Item label="Pró-labore" value={projection.PROLABORE} />
                            </div>

                            {/* Total */}
                            <div className="px-4 py-3 border-t bg-muted/30 flex justify-between font-bold">
                                <span>Total</span>
                                <span className="font-mono">
                                    {projection.TOTAL.toLocaleString('pt-BR', {
                                        minimumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

            </DialogContent>
        </Dialog>
    );
}


function Item({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex justify-between border rounded px-3 py-2">
            <span>{label}</span>
            <span className="font-mono">
                {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
        </div>
    );
}

