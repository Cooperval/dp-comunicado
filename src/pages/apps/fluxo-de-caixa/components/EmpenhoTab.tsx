// src/components/configuracoes/EmpenhoTab.tsx
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/pages/apps/fluxo-de-caixa/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    RefreshCw,
    Eye,
    ChevronsLeft,
    ChevronsRight,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    XCircle,
    Plus,
    Edit
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

type Empenho = {
    ID_EMPENHO: number;
    COD_EMPENHO: number;
    DESCRICAO: string;
    SITUACAO: 'A' | 'I' | null;
};

type EmpenhoTabProps = {
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
                <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={loading || currentPage === 1}>
                    <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(currentPage - 1)} disabled={loading || currentPage === 1}>
                    <ChevronLeft className="w-4 h-4" />
                </Button>

                <span className="text-sm text-muted-foreground px-3">
                    Página {currentPage} de {totalPages || 1}
                </span>

                <Button variant="outline" size="sm" onClick={() => setPage(currentPage + 1)} disabled={loading || currentPage === totalPages}>
                    <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={loading || currentPage === totalPages}>
                    <ChevronsRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};

export default function EmpenhoTab({ token, urlApi }: EmpenhoTabProps) {
    const { toast } = useToast();

    const [empenho, setEmpenho] = useState<Empenho[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState("");

    const [sortConfig, setSortConfig] = useState<{
        key: 'COD_EMPENHO' | 'DESCRICAO' | 'SITUACAO';
        direction: 'asc' | 'desc';
    } | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [dialogData, setDialogData] = useState<TipoContaPagar | null>(null);

    const [form, setForm] = useState({
        cod_empenho: '',
        descricao: '',
        situacao: 'A' as 'A' | 'I',
    });


    const getSituacaoTexto = (s: 'A' | 'I' | null) => s === 'A' ? 'Ativo' : 'Inativo';
    const getSituacaoCor = (s: 'A' | 'I' | null) => s === 'A'
        ? 'bg-green-100 text-green-800 hover:bg-green-200'
        : 'bg-red-100 text-red-800 hover:bg-red-200';



    const [saving, setSaving] = useState(false);
    // === Buscar dados ===
    const fetchEmpenho = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${urlApi}/fluxo-caixa/empenho`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Falha ao carregar empenho");
            const data = await res.json();
            setEmpenho(data);
        } catch (err: any) {
            toast({ title: "Erro", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };


    // === Filtro e ordenação ===
    const filteredAndSorted = useMemo(() => {
        let items = [...empenho]; // <-- sempre crie uma cópia nova

        // Filtro
        if (search) {
            const termo = search.toLowerCase();
            items = items.filter(tipo =>
                tipo.COD_EMPENHO.toString().includes(termo) ||
                (tipo.DESCRICAO || '').toLowerCase().includes(termo)
            );
        }
        console.log(items)

        // Ordenação
        if (sortConfig) {
            items.sort((a, b) => {
                let aVal: any = a[sortConfig.key];
                let bVal: any = b[sortConfig.key];

                if (sortConfig.key === 'COD_EMPENHO') {
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
    }, [empenho, search, sortConfig]);

    const handleSort = (key: 'COD_EMPENHO' | 'DESCRICAO' | 'SITUACAO') => {
        setSortConfig(prev => {
            const newDirection = prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
            return { key, direction: newDirection };
        });
        setPage(1); // ESSA LINHA É CRUCIAL
    };

    const getSortIcon = (key: string) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
    };

    // === Abrir modal (criar ou editar) ===
    const openDialog = (mode: 'create' | 'edit', data?: Empenho) => {
        if (mode === 'create') {
            setForm({ cod_empenho: '', descricao: '', situacao: 'A' });
        } else if (data) {
            setForm({
                cod_empenho: String(data.COD_EMPENHO),
                descricao: data.DESCRICAO || '',
                situacao: data.SITUACAO,
            });
        }
        setDialogMode(mode);
        setDialogData(data || null);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        const codigo = form.cod_empenho.trim();
        if (!codigo || isNaN(Number(codigo)) || Number(codigo) <= 0) {
            toast({ title: "Erro", description: "Código é obrigatório e deve ser um número positivo", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const isEdit = dialogMode === 'edit' && dialogData?.ID_EMPENHO;
            const url = isEdit
                ? `${urlApi}/fluxo-caixa/alterar-empenho/${dialogData!.ID_EMPENHO}`
                : `${urlApi}/fluxo-caixa/adicionar-empenho`;

            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cod_empenho: Number(codigo),
                    situacao: form.situacao,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erro ao salvar empenho");
            }

            toast({
                title: "Sucesso!",
                description: isEdit ? "Empenho atualizado com sucesso" : "Empenho criado com sucesso",
            });

            setDialogOpen(false);
            fetchEmpenho();
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
                            <CardTitle>Empenhos do Grupo 11</CardTitle>
                            <CardDescription>Gerencie os empenhos utilizados no sistema</CardDescription>
                            <CardDescription>
                                <strong>Importante:</strong> qualquer alteração nos Empenhos
                                <strong> reflete automaticamente</strong> nos valores exibidos nas páginas
                                <strong> Fluxo de Caixa / Folha Orçado</strong>.
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={fetchEmpenho} disabled={loading}>
                                {loading ? "Carregando..." : <><RefreshCw className="w-4 h-4 mr-2" /> Atualizar</>}
                            </Button>

                        </div>
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
                                <TableHead className="cursor-pointer" onClick={() => handleSort('COD_EMPENHO')}>
                                    <div className="flex items-center gap-2">Código {getSortIcon('COD_EMPENHO')}</div>
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort('DESCRICAO')}>
                                    <div className="flex items-center gap-2">Descrição {getSortIcon('DESCRICAO')}</div>
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort('SITUACAO')}>
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
                                    .map(tipo => (
                                        <TableRow key={tipo.ID_EMPENHO || tipo.COD_EMPENHO}>
                                            <TableCell className="font-mono font-semibold">{tipo.COD_EMPENHO}</TableCell>
                                            <TableCell>{tipo.DESCRICAO || '-'}</TableCell>
                                            <TableCell>
                                                <Badge className={getSituacaoCor(tipo.SITUACAO)}>
                                                    {getSituacaoTexto(tipo.SITUACAO)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost" onClick={() => openDialog('edit', tipo)}>
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

            {/* Modal de Criação/Edição */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogMode === 'create' ? 'Novo Empenho' : 'Editar Empenho'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Código</Label>
                            <Input
                                type="number"
                                placeholder="Ex: 101"
                                value={form.cod_empenho}
                                onChange={(e) => setForm(prev => ({ ...prev, cod_empenho: e.target.value }))}
                                disabled={dialogMode === 'edit'} // código não pode ser alterado
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input
                                placeholder="Ex: Horas extras"
                                value={form.descricao}
                                onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                                disabled
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Situação *</Label>
                            <Select value={form.situacao} onValueChange={(v) => setForm(prev => ({ ...prev, situacao: v as 'A' | 'I' }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" /> Ativo
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="I">
                                        <div className="flex items-center gap-2">
                                            <XCircle className="w-4 h-4 text-red-600" /> Inativo
                                        </div>
                                    </SelectItem>
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