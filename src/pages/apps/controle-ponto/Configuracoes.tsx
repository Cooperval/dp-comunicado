import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  getTiposOcorrencia,
  createTipoOcorrencia,
  updateTipoOcorrencia,
  deleteTipoOcorrencia,
  getMotivosOcorrencia,
  createMotivoOcorrencia,
  updateMotivoOcorrencia,
  deleteMotivoOcorrencia,
  type TipoOcorrencia,
  type MotivoOcorrencia,
} from '@/services/parametrosLocalStorage';

export default function Configuracoes() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('tipos');
  
  // Estados para Tipos
  const [tipos, setTipos] = useState<TipoOcorrencia[]>([]);
  const [dialogTipo, setDialogTipo] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data?: TipoOcorrencia;
  }>({ open: false, mode: 'create' });
  const [formTipo, setFormTipo] = useState({
    nome: '',
    descricao: '',
    cor: '#6366f1',
    ordem: 0,
  });
  
  // Estados para Motivos
  const [motivos, setMotivos] = useState<MotivoOcorrencia[]>([]);
  const [dialogMotivo, setDialogMotivo] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data?: MotivoOcorrencia;
  }>({ open: false, mode: 'create' });
  const [formMotivo, setFormMotivo] = useState({
    tipoId: '',
    nome: '',
    descricao: '',
    ordem: 0,
  });

  useEffect(() => {
    loadTipos();
    loadMotivos();
  }, []);

  const loadTipos = () => {
    const data = getTiposOcorrencia(false);
    setTipos(data);
  };

  const loadMotivos = () => {
    const data = getMotivosOcorrencia(undefined, false);
    setMotivos(data);
  };

  // ========== CRUD TIPOS ==========

  const handleSaveTipo = () => {
    try {
      if (!formTipo.nome.trim()) {
        toast({ title: 'Nome é obrigatório', variant: 'destructive' });
        return;
      }

      if (dialogTipo.mode === 'create') {
        createTipoOcorrencia({ ...formTipo, nome: formTipo.nome.trim() });
        toast({ title: 'Tipo criado com sucesso!' });
      } else if (dialogTipo.data) {
        updateTipoOcorrencia(dialogTipo.data.id, { ...formTipo, nome: formTipo.nome.trim() });
        toast({ title: 'Tipo atualizado com sucesso!' });
      }
      
      loadTipos();
      setDialogTipo({ open: false, mode: 'create' });
      setFormTipo({ nome: '', descricao: '', cor: '#6366f1', ordem: 0 });
    } catch (error) {
      toast({
        title: 'Erro ao salvar tipo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTipo = (id: string) => {
    if (!confirm('Deseja realmente desativar este tipo de ocorrência? Os motivos vinculados também serão desativados.')) return;
    
    try {
      deleteTipoOcorrencia(id);
      toast({ title: 'Tipo desativado com sucesso!' });
      loadTipos();
      loadMotivos();
    } catch (error) {
      toast({
        title: 'Erro ao desativar tipo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleEditTipo = (tipo: TipoOcorrencia) => {
    setFormTipo({
      nome: tipo.nome,
      descricao: tipo.descricao || '',
      cor: tipo.cor || '#6366f1',
      ordem: tipo.ordem,
    });
    setDialogTipo({ open: true, mode: 'edit', data: tipo });
  };

  // ========== CRUD MOTIVOS ==========

  const handleSaveMotivo = () => {
    try {
      if (!formMotivo.tipoId) {
        toast({ title: 'Tipo de ocorrência é obrigatório', variant: 'destructive' });
        return;
      }
      if (!formMotivo.nome.trim()) {
        toast({ title: 'Nome é obrigatório', variant: 'destructive' });
        return;
      }

      if (dialogMotivo.mode === 'create') {
        createMotivoOcorrencia({ ...formMotivo, nome: formMotivo.nome.trim() });
        toast({ title: 'Motivo criado com sucesso!' });
      } else if (dialogMotivo.data) {
        updateMotivoOcorrencia(dialogMotivo.data.id, { ...formMotivo, nome: formMotivo.nome.trim() });
        toast({ title: 'Motivo atualizado com sucesso!' });
      }
      
      loadMotivos();
      setDialogMotivo({ open: false, mode: 'create' });
      setFormMotivo({ tipoId: '', nome: '', descricao: '', ordem: 0 });
    } catch (error) {
      toast({
        title: 'Erro ao salvar motivo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMotivo = (id: string) => {
    if (!confirm('Deseja realmente desativar este motivo?')) return;
    
    try {
      deleteMotivoOcorrencia(id);
      toast({ title: 'Motivo desativado com sucesso!' });
      loadMotivos();
    } catch (error) {
      toast({
        title: 'Erro ao desativar motivo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleEditMotivo = (motivo: MotivoOcorrencia) => {
    setFormMotivo({
      tipoId: motivo.tipoId,
      nome: motivo.nome,
      descricao: motivo.descricao || '',
      ordem: motivo.ordem,
    });
    setDialogMotivo({ open: true, mode: 'edit', data: motivo });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Parâmetros do Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Configure os tipos e motivos de ocorrências
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tipos">Tipos de Ocorrência</TabsTrigger>
          <TabsTrigger value="motivos">Motivos</TabsTrigger>
        </TabsList>

        {/* ========== ABA TIPOS ========== */}
        <TabsContent value="tipos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tipos de Ocorrência</CardTitle>
                  <CardDescription>
                    Gerencie os tipos de ocorrências disponíveis no sistema
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setFormTipo({ nome: '', descricao: '', cor: '#6366f1', ordem: tipos.length });
                    setDialogTipo({ open: true, mode: 'create' });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Tipo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tipos.map((tipo) => (
                    <TableRow key={tipo.id}>
                      <TableCell className="font-medium">{tipo.nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {tipo.descricao || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: tipo.cor }}
                          />
                          <span className="text-xs text-muted-foreground">{tipo.cor}</span>
                        </div>
                      </TableCell>
                      <TableCell>{tipo.ordem}</TableCell>
                      <TableCell>
                        {tipo.ativo ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="w-3 h-3" />
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTipo(tipo)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {tipo.ativo && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTipo(tipo.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== ABA MOTIVOS ========== */}
        <TabsContent value="motivos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Motivos de Ocorrência</CardTitle>
                  <CardDescription>
                    Gerencie os motivos disponíveis para cada tipo de ocorrência
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setFormMotivo({ tipoId: '', nome: '', descricao: '', ordem: motivos.length });
                    setDialogMotivo({ open: true, mode: 'create' });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Motivo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {motivos.map((motivo) => {
                    const tipo = tipos.find(t => t.id === motivo.tipoId);
                    return (
                      <TableRow key={motivo.id}>
                        <TableCell>
                          <Badge variant="outline" style={{ borderColor: tipo?.cor }}>
                            {tipo?.nome || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{motivo.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {motivo.descricao || '-'}
                        </TableCell>
                        <TableCell>{motivo.ordem}</TableCell>
                        <TableCell>
                          {motivo.ativo ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="w-3 h-3" />
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditMotivo(motivo)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {motivo.ativo && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteMotivo(motivo.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========== DIALOG TIPO ========== */}
      <Dialog open={dialogTipo.open} onOpenChange={(open) => setDialogTipo({ ...dialogTipo, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogTipo.mode === 'create' ? 'Novo Tipo de Ocorrência' : 'Editar Tipo'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do tipo de ocorrência
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo-nome">Nome *</Label>
              <Input
                id="tipo-nome"
                value={formTipo.nome}
                onChange={(e) => setFormTipo({ ...formTipo, nome: e.target.value })}
                placeholder="Ex: Mudança de Escala"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo-descricao">Descrição</Label>
              <Textarea
                id="tipo-descricao"
                value={formTipo.descricao}
                onChange={(e) => setFormTipo({ ...formTipo, descricao: e.target.value })}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo-cor">Cor</Label>
                <Input
                  id="tipo-cor"
                  type="color"
                  value={formTipo.cor}
                  onChange={(e) => setFormTipo({ ...formTipo, cor: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo-ordem">Ordem</Label>
                <Input
                  id="tipo-ordem"
                  type="number"
                  value={formTipo.ordem}
                  onChange={(e) => setFormTipo({ ...formTipo, ordem: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogTipo({ open: false, mode: 'create' })}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveTipo}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== DIALOG MOTIVO ========== */}
      <Dialog open={dialogMotivo.open} onOpenChange={(open) => setDialogMotivo({ ...dialogMotivo, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMotivo.mode === 'create' ? 'Novo Motivo' : 'Editar Motivo'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do motivo de ocorrência
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivo-tipo">Tipo de Ocorrência *</Label>
              <Select
                value={formMotivo.tipoId}
                onValueChange={(value) => setFormMotivo({ ...formMotivo, tipoId: value })}
                disabled={dialogMotivo.mode === 'edit'}
              >
                <SelectTrigger id="motivo-tipo">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tipos.filter(t => t.ativo).map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo-nome">Nome *</Label>
              <Input
                id="motivo-nome"
                value={formMotivo.nome}
                onChange={(e) => setFormMotivo({ ...formMotivo, nome: e.target.value })}
                placeholder="Ex: Consulta médica"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo-descricao">Descrição</Label>
              <Textarea
                id="motivo-descricao"
                value={formMotivo.descricao}
                onChange={(e) => setFormMotivo({ ...formMotivo, descricao: e.target.value })}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo-ordem">Ordem</Label>
              <Input
                id="motivo-ordem"
                type="number"
                value={formMotivo.ordem}
                onChange={(e) => setFormMotivo({ ...formMotivo, ordem: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogMotivo({ open: false, mode: 'create' })}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveMotivo}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}