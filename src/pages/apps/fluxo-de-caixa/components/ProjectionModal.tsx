import { useState, useEffect, useMemo } from 'react';
import { ProjectionItem, CATEGORIES } from '@/pages/apps/fluxo-de-caixa/types/projection';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';


type ProjectionFromApi = {
  ID_PROJECAO: number;
  DATA_PROJECAO: string;
  MES_PROJECAO: string;
  TIPO: 1 | 2;
  URBANA: number;
  RURAL: number;
  MERCADAO: number;
  AGROENERGIA: number;
  PROLABORE: number;
  TOTAL: number;
};


interface ProjectionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    date: string; // yyyy-MM-dd
    type: 'previsao' | 'realizado';
    items: Omit<ProjectionItem, 'id'>[];
  }) => void;
  projection?: ProjectionFromApi | null;
}




const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];


export function ProjectionModal({ open, onClose, onSaved, projection }: ProjectionModalProps) {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Estado para a data específica do dia (dd/MM/yyyy)
  const [year, setYear] = useState<number | undefined>(undefined);
  const [monthIndex, setMonthIndex] = useState<number | undefined>(undefined);
  const [day, setDay] = useState<number | undefined>(undefined);

  // Estado para o mês de referência (apenas mês e ano)
  const [referenceMonthIndex, setReferenceMonthIndex] = useState<number | undefined>(undefined);
  const [referenceYear, setReferenceYear] = useState<number | undefined>(undefined);

  const [type, setType] = useState<'1' | '2'>('1');
  const [values, setValues] = useState<Record<string, { value: string; id: string }>>({});
  const { token, user } = useAuth();
  const [saving, setSaving] = useState(false);

  const dayOptions = useMemo(() => {
    if (monthIndex === undefined || year === undefined) return [];
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [year, monthIndex]);

  // Anos disponíveis: currentYear -2 até +2
  const yearOptions = useMemo(() => {
    const arr: number[] = [];
    for (let y = currentYear - 0; y <= currentYear + 2; y++) arr.push(y);
    return arr;
  }, [currentYear]);



  const API_FIELD_MAP: Record<string, keyof ProjectionFromApi> = {
    urbana: 'URBANA',
    rural: 'RURAL',
    mercadao: 'MERCADAO',
    agroenergia: 'AGROENERGIA',
    prolabore: 'PROLABORE',
    total: 'TOTAL',
  };



  useEffect(() => {
    if (projection) {



      const d = new Date(projection.DATA_PROJECAO);
      if (!isNaN(d.getTime())) {
        setYear(d.getFullYear());
        setMonthIndex(d.getMonth());
        setDay(d.getDate());
      }

      if (projection.MES_PROJECAO) {
        const [y, m] = projection.MES_PROJECAO.split('-').map(Number);
        setReferenceYear(y);
        setReferenceMonthIndex(m - 1);
      }

      setType(String(projection.TIPO) as '1' | '2');

      const newValues: Record<string, { value: string; id: string }> = {};
      CATEGORIES.forEach(cat => {
        const apiField = API_FIELD_MAP[cat.id];

        newValues[cat.name] = {
          value: apiField ? String(projection[apiField] ?? '') : '',
          id: cat.id,
        };
      });


      setValues(newValues);
    } else {
      // Novo
      setYear(undefined);
      setMonthIndex(undefined);
      setDay(undefined);
      setReferenceMonthIndex(undefined);
      setReferenceYear(undefined);
      setType('1');

      const initialValues: Record<string, { value: string; id: string }> = {};
      CATEGORIES.forEach(cat => {
        initialValues[cat.name] = { value: '', id: cat.id };
      });
      setValues(initialValues);
    }
  }, [projection, open]);

  const handleValueChange = (category: string, newValue: string) => {
    setValues(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        value: newValue,
      },
    }));
  };

  const handleSave = async () => {
    if (year === undefined || monthIndex === undefined || day === undefined) {
      alert("Selecione ano, mês e dia.");
      return;
    }

    const isoDate = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');


    // Referência do mês (opcional – envie se quiser usar no backend)
    const referenceMonth = referenceMonthIndex !== undefined && referenceYear !== undefined
      ? `${referenceYear}-${String(referenceMonthIndex + 1).padStart(2, '0')}`
      : null;

    const items = CATEGORIES.map(cat => ({
      category: cat.name,
      value: parseFloat(values[cat.name]?.value?.replace(',', '.') || '0') || 0,
      id: values[cat.name]?.id || cat.id,
    }));
    const isEdit = Boolean(projection?.ID_PROJECAO);

    const payload = {
      ...(isEdit && { id: projection.ID_PROJECAO }),
      date: isoDate,
      type,
      referenceMonth, // opcional – ajuste se seu backend não usa
      items,
      cod_funcionario: user?.id,
    };



    try {
      setSaving(true);
      const endpoint = isEdit
        ? `/fluxo-caixa/atualizar-projecao/${projection.ID_PROJECAO}`
        : '/fluxo-caixa/adicionar-projecao';

      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(`${urlApi}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });


      if (!res.ok) {
        let errMsg = `Erro ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) errMsg = errJson.message;
        } catch { }
        throw new Error(errMsg);
      }


      onSaved();

      onClose();
    } catch (error: any) {
      console.error(error);
      alert('Falha ao salvar: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);

    }
  };

  const totalValue = CATEGORIES.filter(c => c.id !== 'total').reduce((sum, cat) => {
    const val = parseFloat(values[cat.name]?.value?.replace(',', '.') || '0');
    return sum + (isNaN(val) ? 0 : val);
  }, 0);




  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {projection ? 'Editar' : 'Nova'} Projeção
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {/* Projeção do dia */}
          <div className="space-y-1">
            <Label>Projeção do dia</Label>
            <div className="grid grid-cols-3 gap-4">
              {/* Ano */}
              <div className="space-y-1">
                <Label htmlFor="year">Ano</Label>
                <Select
                  value={year !== undefined ? String(year) : undefined}
                  onValueChange={(v) => {
                    const newYear = v ? Number(v) : undefined;
                    setYear(newYear);
                    setDay(undefined); // reseta o dia ao mudar o ano
                  }}
                >
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mês */}
              <div className="space-y-1">
                <Label htmlFor="month">Mês</Label>
                <Select
                  value={monthIndex !== undefined ? String(monthIndex) : undefined}
                  onValueChange={(v) => {
                    const newMonth = v !== undefined ? Number(v) : undefined;
                    setMonthIndex(newMonth);
                    setDay(undefined); // reseta o dia ao mudar o mês
                  }}
                >
                  <SelectTrigger id="month">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS_PT.map((monthName, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {monthName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dia */}
              <div className="space-y-1">
                <Label htmlFor="day">Dia</Label>
                <Select
                  value={day !== undefined ? String(day) : undefined}
                  onValueChange={(v) => setDay(v !== undefined ? Number(v) : undefined)}
                  disabled={monthIndex === undefined || year === undefined}
                >
                  <SelectTrigger id="day">
                    <SelectValue
                      placeholder={
                        monthIndex === undefined || year === undefined
                          ? "Selecione mês e ano"
                          : "Dia"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {dayOptions.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {String(d).padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Projeção referente ao mês */}
          <div className="grid grid-cols-2 gap-4 space-y-1">
            <div className="space-y-2">
              <Label>Projeção referente ao mês - Ano</Label>
              <Select
                value={referenceYear !== undefined ? String(referenceYear) : undefined}
                onValueChange={(v) => setReferenceYear(v ? Number(v) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Mês</Label>
              <Select
                value={referenceMonthIndex !== undefined ? String(referenceMonthIndex) : undefined}
                onValueChange={(v) => setReferenceMonthIndex(v !== undefined ? Number(v) : undefined)}
                disabled={referenceYear === undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS_PT.map((m, idx) => (
                    <SelectItem key={idx} value={String(idx)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as '1' | '2')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Previsão</SelectItem>
                <SelectItem value="2">Realizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Valores por categoria */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Valores por Categoria</Label>
            <div className="space-y-1">
              {CATEGORIES.filter(c => c.id !== "total").map(cat => (
                <div
                  key={cat.id}
                  className="grid grid-cols-[140px_1fr] gap-3 items-center p-3 rounded-lg bg-secondary/50"
                >
                  <span className="font-medium text-sm">{cat.name}</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={values[cat.name]?.value || ''}
                    onChange={(e) => handleValueChange(cat.name, e.target.value)}
                    className="font-mono"
                  />
                </div>
              ))}

              <div className="grid grid-cols-[140px_1fr] gap-3 items-center p-3 rounded-lg bg-secondary">
                <span className="font-bold text-sm">Total</span>
                <div className="font-mono font-bold text-lg">
                  {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
