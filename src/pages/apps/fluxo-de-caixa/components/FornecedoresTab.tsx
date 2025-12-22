// src/components/configuracoes/TiposContasPagarTab.tsx
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
    Search,
    Edit
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

type Fornecedor = {
    ID_FORNECEDOR: number;
    COD_FORNECEDOR: number;
    SITUACAO: string | null;
    DESC_FORNECEDOR: string;
    CGC?: string;
};

type FornecedoresTab = {
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

export default function FornecedoresTab({ token, urlApi }: FornecedoresTab) {
    const { toast } = useToast();

    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);


    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState("");

    const [sortConfig, setSortConfig] = useState<{
        key: 'COD_FORNECEDOR' | 'SITUACAO' | 'DESC_FORNECEDOR';
        direction: 'asc' | 'desc';
    } | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [dialogData, setDialogData] = useState<Fornecedor | null>(null);

    const [form, setForm] = useState({
        cod_fornecedor: '',
        desc_fornecedor: '',
        situacao: 'A' as 'A' | 'I',
    });


    const getSituacaoTexto = (s: 'A' | 'I' | null) => s === 'A' ? 'Ativo' : 'Inativo';
    const getSituacaoCor = (s: 'A' | 'I' | null) => s === 'A'
        ? 'bg-green-100 text-green-800 hover:bg-green-200'
        : 'bg-red-100 text-red-800 hover:bg-red-200';



    const [saving, setSaving] = useState(false);
    // === Buscar dados ===
    const fetchFornecedores = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${urlApi}/fluxo-caixa/consultar-fornecedor-inativos`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Falha ao carregar fornecedores");
            const data = await res.json();
            setFornecedores(data);
        } catch (err: any) {
            toast({ title: "Erro", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };



    // === Filtro e ordenação ===
    const filteredAndSorted = useMemo(() => {
        let items = [...fornecedores]; // <-- sempre crie uma cópia nova

        // Filtro
        if (search) {
            const termo = search.toLowerCase();
            items = items.filter(f =>
                f.COD_FORNECEDOR.toString().includes(termo) ||
                (f.DESC_FORNECEDOR || '').toLowerCase().includes(termo)
            );
        }


        // Ordenação
        if (sortConfig) {
            items.sort((a, b) => {
                let aVal: any = a[sortConfig.key];
                let bVal: any = b[sortConfig.key];

                if (sortConfig.key === 'COD_FORNECEDOR') {
                    aVal = Number(aVal);
                    bVal = Number(bVal);
                }
                if (sortConfig.key === 'SITUACAO') {
                    aVal = aVal === 'A' ? 0 : 1;
                    bVal = bVal === 'A' ? 0 : 1;
                }
                if (sortConfig.key === 'DESC_FORNECEDOR') {
                    aVal = (aVal || '').toString().toLowerCase();
                    bVal = (bVal || '').toString().toLowerCase();
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return items;
    }, [fornecedores, search, sortConfig]);

    const handleSort = (key: 'COD_FORNECEDOR' | 'DESC_DESCRICAO' | 'SITUACAO') => {
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
    const openDialog = (mode: 'create' | 'edit', data?: Fornecedor) => {
        if (mode === 'create') {
            setForm({ cod_fornecedor: '', desc_fornecedor: '', situacao: 'A' });
        } else if (data) {
            setForm({
                cod_fornecedor: String(data.COD_FORNECEDOR),
                desc_fornecedor: data.DESC_FORNECEDOR || '',
                situacao: data.SITUACAO,
            });
        }
        setDialogMode(mode);
        setDialogData(data || null);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        const codigo = form.cod_fornecedor?.toString().trim();

        if (!codigo || isNaN(Number(codigo)) || Number(codigo) <= 0) {
            toast({
                title: "Erro",
                description: "Código do fornecedor é obrigatório e deve ser numérico.",
                variant: "destructive",
            });
            return;
        }

        if (!form.situacao) {
            toast({
                title: "Erro",
                description: "Situação é obrigatória.",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        try {
            const isEdit = dialogMode === "edit" && dialogData?.ID_FORNECEDOR;

            const url = isEdit
                ? `${urlApi}/fluxo-caixa/alterar-fornecedor/${dialogData!.ID_FORNECEDOR}`
                : `${urlApi}/fluxo-caixa/adicionar-fornecedor`;

            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cod_fornecedor: Number(codigo),
                    situacao: form.situacao,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erro ao salvar fornecedor");
            }

            toast({
                title: "Sucesso!",
                description: isEdit ? "Fornecedor atualizado." : "Fornecedor criado.",
            });

            setDialogOpen(false);
            fetchFornecedores(); // sua nova função de listagem
        } catch (err: any) {
            toast({
                title: "Erro",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };



    const [isFornecedorModalOpen, setIsFornecedorModalOpen] = useState(false);
    const [fornecedorId, setFornecedorId] = useState("");
    const [fornecedor, setFornecedor] = useState(null);
    const [loadingFornecedor, setLoadingFornecedor] = useState(false);

    const buscarFornecedor = async () => {
        if (!fornecedorId) {
            toast({ title: "Erro", description: "Digite um ID válido", variant: "destructive" });
            return;
        }

        setLoadingFornecedor(true);
        setFornecedor(null);

        try {
            const res = await fetch(`${urlApi}/fluxo-caixa/consultar-fornecedor/${fornecedorId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                if (res.status === 404) throw new Error("Fornecedor não encontrado.");
                throw new Error("Erro ao consultar fornecedor.");
            }

            const data = await res.json();
            setFornecedor(data);

        } catch (err: any) {
            toast({
                title: "Erro",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setLoadingFornecedor(false);
        }
    };

    const [situacao, setSituacao] = useState("");
    const [savingFornecedor, setSavingFornecedor] = useState(false);

    const handleSaveFornecedor = async () => {
        if (!fornecedor) {
            toast({
                title: "Erro",
                description: "Busque um fornecedor antes de salvar.",
                variant: "destructive",
            });
            return;
        }

        if (!situacao) {
            toast({
                title: "Erro",
                description: "Selecione a situação.",
                variant: "destructive",
            });
            return;
        }

        setSavingFornecedor(true);

        try {
            const res = await fetch(`${urlApi}/fluxo-caixa/adicionar-fornecedor`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cod_fornecedor: fornecedor.COD_FORNECEDOR,
                    situacao: situacao,
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Erro ao salvar fornecedor.");

            toast({
                title: "Sucesso",
                description: "Fornecedor cadastrado com sucesso.",
            });

            // Reset do modal
            setFornecedor(null);
            setSituacao("");
            setFornecedorId("");
            setIsFornecedorModalOpen(false);

        } catch (err: any) {
            toast({
                title: "Erro",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setSavingFornecedor(false);
        }
    };



    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <CardTitle>Fornecedores</CardTitle>
                            <CardDescription>Gerencie os fornecedores no sistema</CardDescription>
                            <CardDescription>
                                <strong>Importante:</strong> qualquer alteração nos Fornecedor
                                <strong> reflete automaticamente</strong> nos valores exibidos nas páginas
                                <strong> Pendências</strong> e <strong> Fluxo de Caixa</strong>.
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={fetchFornecedores} disabled={loading}>
                                {loading ? "Carregando..." : <><RefreshCw className="w-4 h-4 mr-2" /> Atualizar</>}
                            </Button>
                            <Button variant="outline" onClick={() => setIsFornecedorModalOpen(true)}>
                                <Search className="w-4 h-4 mr-2" /> Buscar Fornecedor
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
                                <TableHead className="cursor-pointer" onClick={() => handleSort('COD_FORNECEDOR')}>
                                    <div className="flex items-center gap-2">Código {getSortIcon('COD_FORNECEDOR')}</div>
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort('DESC_FORNECEDOR')}>
                                    <div className="flex items-center gap-2">Descrição {getSortIcon('DESC_FORNECEDOR')}</div>
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
                                        <TableRow key={tipo.ID_FORNECEDOR || tipo.COD_FORNECEDOR}>
                                            <TableCell className="font-mono font-semibold">{tipo.COD_FORNECEDOR}</TableCell>
                                            <TableCell>{tipo.DESC_FORNECEDOR || '-'}</TableCell>
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
                            {dialogMode === 'create' ? 'Novo Fornecedor' : 'Editar Fornecedor'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Código</Label>
                            <Input
                                type="number"
                                placeholder="Ex: 101"
                                value={form.cod_fornecedor}
                                onChange={(e) => setForm(prev => ({ ...prev, cod_fornecedor: e.target.value }))}
                                disabled={dialogMode === 'edit'} // código não pode ser alterado
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input
                                placeholder="Ex: Fornecedores"
                                value={form.desc_fornecedor}
                                onChange={(e) => setForm(prev => ({ ...prev, desc_fornecedor: e.target.value }))}
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

            {/* Modal de Fornecedores */}
            <Dialog open={isFornecedorModalOpen} onOpenChange={setIsFornecedorModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Buscar Fornecedor</DialogTitle>
                        <DialogDescription>Digite o código do fornecedor</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-2">
                        <input
                            type="number"
                            className="w-full border rounded p-2"
                            placeholder="ID do fornecedor"
                            value={fornecedorId}
                            onChange={(e) => setFornecedorId(e.target.value)}
                        />

                        <Button onClick={buscarFornecedor} disabled={loadingFornecedor}>
                            {loadingFornecedor ? "Buscando..." : "Buscar"}
                        </Button>
                    </div>

                    {fornecedor && (
                        <div>
                            <div className="space-y-2">
                                <Label>Código</Label>
                                <Input
                                    type="number"
                                    value={fornecedor.COD_FORNECEDOR}
                                    disabled
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nome</Label>
                                <Input
                                    type="text"
                                    value={fornecedor.DESC_FORNECEDOR}
                                    disabled
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>CNPJ</Label>
                                <Input
                                    type="text"
                                    value={fornecedor.CGC}
                                    disabled
                                />
                            </div>


                            <div className="space-y-2 mt-4">
                                <Label>Situação *</Label>
                                <Select value={situacao} onValueChange={setSituacao}>
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

                            <DialogFooter className='mt-4'>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleSaveFornecedor} disabled={savingFornecedor}>
                                    {savingFornecedor ? "Salvando..." : "Salvar"}
                                </Button>

                            </DialogFooter>
                        </div>



                    )}




                </DialogContent>
            </Dialog>

        </>
    );
}