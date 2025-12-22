import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProjectionTable } from '@/pages/apps/fluxo-de-caixa/components/ProjectionTable';
import { ProjectionModal } from '@/pages/apps/fluxo-de-caixa/components/ProjectionModal';
import { ProjectionViewModal } from '@/pages/apps/fluxo-de-caixa/components/ProjectionViewModal';
import { ActivityLog } from '@/pages/apps/fluxo-de-caixa/components/ActivityLog';
import { useProjections } from '@/pages/apps/fluxo-de-caixa/hooks/useProjections';
import { Projection } from '@/pages/apps/fluxo-de-caixa/types/projection';
import { useProjecao } from "@/pages/apps/fluxo-de-caixa/hooks/use-projecao";
import { useLogsProjecao } from '@/pages/apps/fluxo-de-caixa/hooks/use-logs-projecao';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatProjectionLogs } from '@/pages/apps/fluxo-de-caixa/util/formatProjectionLog';

const Index = () => {
  const { addProjection, updateProjection } = useProjections();
  const { projecao, fetchDataprojecao } = useProjecao();
  const { logsProjecao, fetchDataLogsProjecao } = useLogsProjecao();

  const formattedLogs = useMemo(() => {
    return formatProjectionLogs(logsProjecao || []);
  }, [logsProjecao]);

  const { token, user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjection, setEditingProjection] = useState<Projection | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectionToDelete, setProjectionToDelete] = useState<string | null>(null);
  const [viewProjection, setViewProjection] = useState<Projection | null>(null);

  const { toast } = useToast();

  useEffect(() => { fetchDataprojecao(); }, [fetchDataprojecao]);
  useEffect(() => { fetchDataLogsProjecao(); }, [fetchDataLogsProjecao]);


  const handleOpenModal = (projection?: Projection) => {
    setEditingProjection(projection || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProjection(null);
  };

  const handleSaved = async () => {
    await Promise.all([
      fetchDataprojecao(),
      fetchDataLogsProjecao(),
    ]);
  };


  const handleDeleteClick = (projectionId: string) => {
    setProjectionToDelete(projectionId);
    setDeleteDialogOpen(true);
  };



  async function deleteProjection(projectionId: string, cod_funcionario: number) {
    const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');

    if (!urlApi) {
      console.error('[deleteProjection] URL da API não configurada');
      throw new Error('API indisponível');
    }

    const response = await fetch(`${urlApi}/fluxo-caixa/excluir-projecao/${projectionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cod_funcionario: user.id }), // ← Envia o código do funcionário
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));

      console.error('[deleteProjection] Erro ao excluir', {
        status: response.status,
        error,
      });

      throw new Error(error.message || error.error || 'Erro ao excluir projeção');
    }

    // Atualiza a lista após exclusão
    fetchDataprojecao();
    fetchDataLogsProjecao();
    return response.json();
  }

  const handleConfirmDelete = async () => {
    if (!projectionToDelete) return;

    try {
      await deleteProjection(projectionToDelete);

      toast({
        title: 'Projeção removida',
        description: 'A projeção foi removida com sucesso.',
        variant: 'destructive',
      });

    } catch (err: any) {
      toast({
        title: 'Erro ao remover projeção',
        description: err.message || 'Erro inesperado',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setProjectionToDelete(null);
    }
  };




  const [selectedMonth, setSelectedMonth] = useState<{
    year: number;
    month: number;
  } | null>(null);

  function getProjectionsByMonth(data: any[], year: number, month: number) {
    return data.filter(p => {
      const d = new Date(p.DATA_PROJECAO);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }


  const handleEdit = (projection: Projection) => {
    const date = new Date(projection.DATA_PROJECAO);

    setSelectedMonth({
      year: date.getFullYear(),
      month: date.getMonth(),
    });

    setEditingProjection(projection); // 👈 estado novo
    setIsModalOpen(true);
  };


  const projectionsOfSelectedMonth = selectedMonth
    ? getProjectionsByMonth(
      projecao,
      selectedMonth.year,
      selectedMonth.month
    )
    : [];


  const handleViewProjection = (projection: Projection) => {
    setViewProjection(projection);
  };



  const [viewMonth, setViewMonth] = useState<{
    monthKey: string;
    projections: Projection[];
  } | null>(null);



  return (
    <>
      <div className="min-h-screen bg-background">


        <main className="  container mx-auto px-6 py-8 space-y-8 bg-white dark:bg-background rounded-lg shadow-sm border">


          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Projeções Cadastradas</h2>
                <Button
                  onClick={() => handleOpenModal()}
                  className="bg-primary hover:bg-primary/90 shadow-soft"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Projeção
                </Button>
              </div>

              <ProjectionTable
                projecao={projecao}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onViewMonth={setViewMonth}
              />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-[1fr-360px] gap-6">
              <div>
                <ActivityLog logs={formattedLogs} />
              </div>
            </div>

          </div>
        </main>


        <ProjectionModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSaved={handleSaved}
          projections={projectionsOfSelectedMonth}
          projection={editingProjection}

        />

        <ProjectionViewModal
          open={!!viewMonth}
          onClose={() => setViewMonth(null)}
          monthLabel={
            viewMonth
              ? format(
                new Date(viewMonth.projections[0].DATA_PROJECAO),
                'MMMM/yyyy',
                { locale: ptBR }
              )
              : ''
          }
          projections={viewMonth?.projections || []}
        />



        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover esta projeção? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default Index;
