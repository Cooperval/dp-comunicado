import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {


  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';


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
      {/* <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Itens por página:</span>
        <Select
          value={perPage.toString()}
          onValueChange={(v) => {
            setPerPage(Number(v));
            setPage(1);
          }}
          disabled={loading}
        >
          <SelectTrigger className="w-20">
            <Select afrSelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>
          {totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, totalItems)} de {totalItems}
        </span>
      </div> */}

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


const filterItems = <T extends object>(
  items: T[],
  search: string,
  keys: (keyof T)[]
): T[] => {
  if (!search.trim()) return items;
  const term = search.toLowerCase();
  return items.filter((item) =>
    keys.some((key) => String(item[key]).toLowerCase().includes(term))
  );
};

export default function Configuracoes() {
  const { toast } = useToast();
  const { token } = useAuth();

  const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
  const [activeTab, setActiveTab] = useState('opBaixa');




  // Estado dedicado às operações de baixa
  const [operacoesBaixa, setOperacoesBaixa] = useState<Array<{
    cod_operacaobaixa: number;
    descricao: string;
  }>>([]);

  const [loadingOpBaixa, setLoadingOpBaixa] = useState();
  const [errorOpBaixa, setErrorOpBaixa] = useState<string | null>(null);


  const fetchOperacoesBaixa = async () => {
    setLoadingOpBaixa(true);
    setErrorOpBaixa(null);

    try {
      if (!urlApi) throw new Error("VITE_API_URL não configurada");
      if (!token) throw new Error("Token de autenticação não encontrado.");

      const response = await fetch(`${urlApi}/fluxo-caixa/operacoes-baixa`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const data = await response.json();

      // Dados já vêm no formato certo: { cod_operacaobaixa: number, descricao: string }
      setOperacoesBaixa(data);

    } catch (err: any) {
      console.error("Erro ao carregar operações de baixa:", err);
      setErrorOpBaixa(err.message);
      toast({
        title: "Erro ao carregar operações",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoadingOpBaixa(false);
    }
  };

























  // Estado do modal (agora reutilizado para tudo)
  const [dialogOpBaixa, setDialogOpBaixa] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data?: {
      cod_operacaobaixa: number;
      descricao: string;
      situacao: 'A' | 'I'; // A = Ativo, I = Inativo
    };
  }>({ open: false, mode: 'create' });

  // Formulário para criar/editar
  const [formOpBaixa, setFormOpBaixa] = useState({
    descricao: '',
    situacao: 'A' as 'A' | 'I',
  });

  const [saving, setSaving] = useState(false);

  const openDialogOpBaixa = (mode: 'create' | 'edit', data?: typeof operacoesBaixa[0]) => {
    if (mode === 'create') {
      setFormOpBaixa({ descricao: '', situacao: 'A' });
    } else if (data) {
      setFormOpBaixa({
        descricao: data.DESCRICAO || '', // ← garante string
        situacao: (data.SITUACAO === 'A' || data.ATIVO) ? 'A' : 'I',
      });
    }

    setDialogOpBaixa({
      open: true,
      mode,
      data: data
        ? {
          cod_operacaobaixa: data.cod_operacaobaixa,
          descricao: data.descricao || '',
          situacao: (data.situacao === 'A' || data.ativo) ? 'A' : 'I',
        }
        : undefined,
    });
  };

  const handleSaveOpBaixa = async () => {
    if (!formOpBaixa.descricao.trim()) {
      toast({ title: "Erro", description: "A descrição é obrigatória.", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const url = dialogOpBaixa.mode === 'create'
        ? `${urlApi}/fluxo-caixa/operacoes-baixa`
        : `${urlApi}/fluxo-caixa/operacoes-baixa/${dialogOpBaixa.data?.cod_operacaobaixa}`;

      const method = dialogOpBaixa.mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          descricao: formOpBaixa.descricao.trim(),
          situacao: formOpBaixa.situacao,
        }),
      });

      if (!response.ok) throw new Error("Falha ao salvar operação");

      toast({
        title: "Sucesso!",
        description: dialogOpBaixa.mode === 'create'
          ? "Operação criada com sucesso!"
          : "Operação atualizada com sucesso!",
      });

      setDialogOpBaixa({ open: false, mode: 'create' });
      fetchOperacoesBaixa(); // recarrega a lista
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };




  // === ESTADO PARA TIPOS DE CONTAS A PAGAR ===
  const [tiposContasPagar, setTiposContasPagar] = useState<Array<{
    cod_tipocontaspagar: number;
    descricao: string;
  }>>([]);

  const [loadingTiposContas, setLoadingTiposContas] = useState(false);
  const [errorTiposContas, setErrorTiposContas] = useState<string | null>(null);

  const fetchTiposContasPagar = async () => {
    setLoadingTiposContas(true);
    setErrorTiposContas(null);

    try {
      if (!urlApi) throw new Error("VITE_API_URL não configurada");
      if (!token) throw new Error("Token de autenticação não encontrado.");

      const response = await fetch(`${urlApi}/fluxo-caixa/tipos-contas-pagar`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const data = await response.json();
      setTiposContasPagar(data);

    } catch (err: any) {
      console.error("Erro ao carregar tipos de contas a pagar:", err);
      setErrorTiposContas(err.message);
      toast({
        title: "Erro ao carregar tipos",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoadingTiposContas(false);
    }
  };



  // === PAGINAÇÃO PARA OPERAÇÕES DE BAIXA ===
  const [opBaixaPage, setOpBaixaPage] = useState(1);
  const [opBaixaPerPage, setOpBaixaPerPage] = useState(10);
  const [searchOpBaixa, setSearchOpBaixa] = useState("");

  const filteredOperacoesBaixa = operacoesBaixa.filter(op => {
    const termo = searchOpBaixa.toLowerCase();
    return (
      op.COD_OPERACAOBAIXA.toString().includes(termo) ||
      op.DESCRICAO.toLowerCase().includes(termo)
    );
  });



  // === PAGINAÇÃO PARA TIPOS DE CONTAS ===
  // PAGINAÇÃO PARA TIPOS DE CONTAS
  const [tiposPage, setTiposPage] = useState(1);
  const [tiposPerPage, setTiposPerPage] = useState(10);
  const [searchTipos, setSearchTipos] = useState("");


  const filteredTiposContas = tiposContasPagar.filter(op => {
    const termo = searchTipos.toLowerCase();
    return (
      op.COD_TIPOCONTASPAGAR.toString().includes(termo) ||
      op.DESCRICAO.toLowerCase().includes(termo)
    );
  });



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações do Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Configure quais as operações de baixa
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full min-w-[400px] max-w-4xl grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
          <TabsTrigger value="opBaixa" className="text-xs">
            Operações de Baixa
          </TabsTrigger>
          <TabsTrigger value="tiposContas">Tipos de Contas</TabsTrigger>

        </TabsList>

        {/* ========== ABA OPBAIXA ========== */}
        <TabsContent value="opBaixa" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Operações de Baixa</CardTitle>
                  <CardDescription>
                    Lista de operações de baixa, as operações ativas vão influenciar o Fluxo de Caixa
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={fetchOperacoesBaixa}
                  disabled={loadingOpBaixa}
                >
                  {loadingOpBaixa ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin mr-2" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Atualizar
                    </>
                  )}
                </Button>
              </div>



            </CardHeader>

            <CardContent>
              <div className="mt-4 flex items-center gap-2">
                <Input
                  placeholder="Pesquisar por código ou descrição..."
                  value={searchOpBaixa}
                  onChange={(e) => {
                    setSearchOpBaixa(e.target.value);
                    setOpBaixaPage(1); // reset página ao pesquisar
                  }}
                  className="max-w-sm"
                />
                {searchOpBaixa && (
                  <Button variant="ghost" onClick={() => setSearchOpBaixa("")}>
                    Limpar
                  </Button>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loadingOpBaixa ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                          <span>Carregando operações...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : errorOpBaixa ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-destructive">
                        Erro: {errorOpBaixa}
                        <Button variant="ghost" size="sm" className="ml-4" onClick={fetchOperacoesBaixa}>
                          Tentar novamente
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : operacoesBaixa.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                        Nenhuma operação de baixa encontrada.
                        <br />
                        <Button variant="link" size="sm" onClick={fetchOperacoesBaixa}>
                          Clique aqui para carregar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOperacoesBaixa
                      .slice((opBaixaPage - 1) * opBaixaPerPage, opBaixaPage * opBaixaPerPage)
                      .map((op) => (
                        <TableRow key={op.COD_OPERACAOBAIXA}>
                          <TableCell className="font-mono font-semibold">{op.COD_OPERACAOBAIXA}</TableCell>
                          <TableCell>{op.DESCRICAO}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => openDialogOpBaixa('edit', op)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>

                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="p-0">
                      <div className="flex justify-center py-4">
                        <PaginationControls
                          currentPage={opBaixaPage}
                          setPage={setOpBaixaPage}
                          perPage={opBaixaPerPage}
                          setPerPage={setOpBaixaPerPage}
                          totalItems={operacoesBaixa.length}
                          loading={loadingOpBaixa}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== ABA TIPOS DE CONTAS A PAGAR ========== */}
        <TabsContent value="tiposContas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tipos de Contas a Pagar</CardTitle>
                  <CardDescription>
                    Tipos de contas utilizados no módulo de contas a pagar
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={fetchTiposContasPagar}
                  disabled={loadingTiposContas}
                >
                  {loadingTiposContas ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin mr-2" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Atualizar
                    </>
                  )}
                </Button>
              </div>



            </CardHeader>

            <CardContent>
              <div className="mt-4 flex items-center gap-2">
                <Input
                  placeholder="Pesquisar por código ou descrição..."
                  value={searchTipos}
                  onChange={(e) => {
                    setSearchTipos(e.target.value);
                    setTiposPage(1); // reset página ao pesquisar
                  }}
                  className="max-w-sm"
                />
                {searchTipos && (
                  <Button variant="ghost" onClick={() => { setSearchTipos(""); setTiposPage(1); }}>
                    Limpar
                  </Button>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loadingTiposContas ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                          <span>Carregando tipos...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : errorTiposContas ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-destructive">
                        Erro: {errorTiposContas}
                        <Button variant="ghost" size="sm" className="ml-4" onClick={fetchTiposContasPagar}>
                          Tentar novamente
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : tiposContasPagar.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                        Nenhum tipo de conta encontrado.
                        <br />
                        <Button variant="link" size="sm" onClick={fetchTiposContasPagar}>
                          Clique aqui para carregar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTiposContas
                      .slice((tiposPage - 1) * tiposPerPage, tiposPage * tiposPerPage)
                      .map((tipo) => (
                        <TableRow key={tipo.COD_TIPOCONTASPAGAR}>
                          <TableCell className="font-mono font-semibold">{tipo.COD_TIPOCONTASPAGAR}</TableCell>
                          <TableCell>{tipo.DESCRICAO}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => alert(`Editar ${tipo.COD_TIPOCONTASPAGAR}`)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>

                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="p-0">
                      <div className="flex justify-center py-4">
                        <PaginationControls
                          currentPage={tiposPage}
                          setPage={setTiposPage}
                          perPage={tiposPerPage}
                          setPerPage={setTiposPerPage}
                          totalItems={filteredTiposContas.length}
                          loading={loadingTiposContas}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                </TableFooter>

              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>


      <Dialog open={dialogOpBaixa.open} onOpenChange={(open) => setDialogOpBaixa({ ...dialogOpBaixa, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogOpBaixa.mode === 'create' ? 'Nova Operação de Baixa' : 'Editar Operação'}
            </DialogTitle>
            <DialogDescription>
              {dialogOpBaixa.mode === 'create'
                ? 'Crie uma nova operação de baixa no sistema'
                : 'Altere os dados da operação selecionada'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="op-descricao">Descrição</Label>
              <Input
                id="op-descricao"
                value={formOpBaixa.descricao}
                onChange={(e) => setFormOpBaixa({ ...formOpBaixa, descricao: e.target.value })}
                placeholder="Ex: Pagamento em Dinheiro"
                disabled
              />
            </div>

            {/* Situação */}
            <div className="space-y-2">
              <Label htmlFor="op-situacao">Situação *</Label>
              <Select
                value={formOpBaixa.situacao}
                onValueChange={(value) => setFormOpBaixa({ ...formOpBaixa, situacao: value as 'A' | 'I' })}
              >
                <SelectTrigger id="op-situacao">
                  <SelectValue placeholder="Selecione a situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Ativo
                    </div>
                  </SelectItem>
                  <SelectItem value="I">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Inativo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpBaixa({ open: false, mode: 'create' })}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveOpBaixa} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}