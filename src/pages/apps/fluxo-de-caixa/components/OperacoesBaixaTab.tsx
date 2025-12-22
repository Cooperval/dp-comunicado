// src/components/configuracoes/OperacoesBaixaTab.tsx
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/pages/apps/fluxo-de-caixa/hooks/use-toast';
import {
  ArrowUpDown, ArrowUp, ArrowDown, Edit, RefreshCw, CheckCircle, XCircle, ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';


type OperacaoBaixa = {
  ID_OPERACAOBAIXA?: number;
  COD_OPERACAOBAIXA: number;
  DESCRICAO: string;
  SITUACAO: 'A' | 'I' | null;
};

type OperacoesBaixaTabProps = {
  token: string;
  urlApi: string;
};


const PaginationControls = ({
  currentPage,
  setPage,
  perPage,
  setPerPage,
  totalItems,
  loading,
}: {
  currentPage: number;
  setPage: (page: number) => void;
  perPage: number;
  setPerPage: (perPage: number) => void;
  totalItems: number;
  loading: boolean;
}) => {
  const totalPages = Math.ceil(totalItems / perPage);

  return (
    <div className="flex items-center justify-between mt-4">

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(1)}
          disabled={loading || currentPage === 1}
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(currentPage - 1)}
          disabled={loading || currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <span className="text-sm text-muted-foreground px-3">
          Página {currentPage} de {totalPages || 1}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(currentPage + 1)}
          disabled={loading || currentPage === totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(totalPages)}
          disabled={loading || currentPage === totalPages}
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default function OperacoesBaixaTab({ token, urlApi }: OperacoesBaixaTabProps) {
  const { toast } = useToast();

  const [operacoesBaixa, setOperacoesBaixa] = useState<OperacaoBaixa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const [sortConfig, setSortConfig] = useState<{ key: 'COD_OPERACAOBAIXA' | 'DESCRICAO' | 'SITUACAO'; direction: 'asc' | 'desc' } | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [dialogData, setDialogData] = useState<OperacaoBaixa | null>(null);

  const [form, setForm] = useState({
    cod_operacaobaixa: '',
    descricao: '',
    situacao: 'A' as 'A' | 'I',
  });

  const [saving, setSaving] = useState(false);

  // === Buscar dados ===
  const fetchOperacoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${urlApi}/fluxo-caixa/operacoes-baixa`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Falha ao carregar operações");
      const data = await res.json();
      setOperacoesBaixa(data);
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };



  // === Filtro e ordenação ===
  const filteredAndSorted = useMemo(() => {
    let items = operacoesBaixa.filter(op => {
      const termo = search.toLowerCase();
      return (
        op.COD_OPERACAOBAIXA.toString().includes(termo) ||
        op.DESCRICAO.toLowerCase().includes(termo)
      );
    });

    if (sortConfig) {
      items.sort((a, b) => {
        let aVal: any = a[sortConfig.key];
        let bVal: any = b[sortConfig.key];

        if (sortConfig.key === 'COD_OPERACAOBAIXA') {
          aVal = Number(aVal);
          bVal = Number(bVal);
        }
        if (sortConfig.key === 'SITUACAO') {
          aVal = aVal === 'A' ? 0 : 1;
          bVal = bVal === 'A' ? 0 : 1;
        }
        if (sortConfig.key === 'DESCRICAO') {
          aVal = (aVal || '').toString().toLowerCase();
          bVal = (bVal || '').toString().toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return items;
  }, [operacoesBaixa, search, sortConfig]);

  const handleSort = (key: 'COD_OPERACAOBAIXA' | 'DESCRICAO' | 'SITUACAO') => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const getSituacaoTexto = (s: 'A' | 'I' | null) => s === 'A' ? 'Ativo' : 'Inativo';
  const getSituacaoCor = (s: 'A' | 'I' | null) => s === 'A' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

  // === Modal ===
  const openDialog = (mode: 'create' | 'edit', data?: OperacaoBaixa) => {
    if (mode === 'create') {
      setForm({ cod_operacaobaixa: '', descricao: '', situacao: 'A' });
    } else if (data) {
      setForm({
        cod_operacaobaixa: String(data.COD_OPERACAOBAIXA),
        descricao: data.DESCRICAO,
        situacao: data.SITUACAO === 'A' ? 'A' : 'I',
      });
    }
    setDialogMode(mode);
    setDialogData(data || null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (dialogMode === 'create' && (!form.cod_operacaobaixa.trim() || Number(form.cod_operacaobaixa) <= 0)) {
      toast({ title: "Erro", description: "Código obrigatório", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const isEdit = dialogMode === 'edit' && dialogData?.ID_OPERACAOBAIXA;
      const url = isEdit
        ? `${urlApi}/fluxo-caixa/alterar-operacao-baixa/${dialogData!.ID_OPERACAOBAIXA}`
        : `${urlApi}/fluxo-caixa/adicionar-operacao-baixa`;

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cod_operacaobaixa: Number(form.cod_operacaobaixa),
          situacao: form.situacao,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }

      toast({ title: "Sucesso!", description: isEdit ? "Atualizado" : "Criado" });
      setDialogOpen(false);
      fetchOperacoes();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle>Operações de Baixa</CardTitle>

              <CardDescription>
                Gerencie as operações de baixa utilizadas no sistema.
              </CardDescription>

              <CardDescription>
                <strong>Importante:</strong> qualquer alteração nas Operações de Baixa
                <strong> reflete automaticamente</strong> nos valores exibidos nas páginas
                <strong> Movimentações</strong> e <strong> Fluxo de Caixa</strong>.
              </CardDescription>
            </div>

            <Button variant="outline" onClick={fetchOperacoes} disabled={loading}>
              {loading ? <>Carregando...</> : <><RefreshCw className="w-4 h-4 mr-2" /> Atualizar</>}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="Pesquisar por código ou descrição..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="max-w-sm"
            />
            {search && <Button variant="ghost" onClick={() => { setSearch(""); setPage(1); }}>Limpar</Button>}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('COD_OPERACAOBAIXA')}>
                  <div className="flex items-center gap-2">Código {getSortIcon('COD_OPERACAOBAIXA')}</div>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('DESCRICAO')}>
                  <div className="flex items-center gap-2">Descrição {getSortIcon('DESCRICAO')}</div>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('SITUACAO')}>
                  <div className="flex items-center gap-2">Situação {getSortIcon('SITUACAO')}</div>
                </TableHead>
                <TableHead className="text-right w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>

              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12">Carregando...</TableCell></TableRow>
              ) : filteredAndSorted.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Nenhum dado encontrado, clique em Atualizar</TableCell></TableRow>
              ) : (
                filteredAndSorted
                  .slice((page - 1) * perPage, page * perPage)
                  .map(op => (
                    <TableRow key={op.COD_OPERACAOBAIXA}>
                      <TableCell className="font-mono font-semibold">{op.COD_OPERACAOBAIXA}</TableCell>
                      <TableCell>{op.DESCRICAO}</TableCell>
                      <TableCell>
                        <Badge className={getSituacaoCor(op.SITUACAO)}>
                          {getSituacaoTexto(op.SITUACAO)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => openDialog('edit', op)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="p-0">
                  <div className="py-4 flex justify-center bg-white dark:bg-background ">
                    <PaginationControls
                      currentPage={page}
                      setPage={setPage}
                      perPage={perPage}
                      setPerPage={setPerPage}
                      totalItems={filteredAndSorted.length}
                      loading={loading}
                    />
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'Nova Operação de Baixa' : 'Editar Operação'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input disabled value={form.cod_operacaobaixa} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input disabled value={form.descricao} />
            </div>
            <div className="space-y-2">
              <Label>Situação *</Label>
              <Select value={form.situacao} onValueChange={(v) => setForm(prev => ({ ...prev, situacao: v as 'A' | 'I' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A"><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Ativo</div></SelectItem>
                  <SelectItem value="I"><div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-600" /> Inativo</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}