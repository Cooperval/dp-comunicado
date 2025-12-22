import { Button } from "@/components/ui/button";
import { Board } from "@/pages/apps/fechamento/types";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';

interface ExcelExportProps {
  board: Board;
  projectName: string;
}

export const ExcelExport = ({ board, projectName }: ExcelExportProps) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const formatValue = (value: number | undefined, type: string | undefined) => {
    if (!value || !type) return '';
    
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      case 'tons':
        return `${value.toLocaleString('pt-BR')} t`;
      case 'hectares':
        return `${value.toLocaleString('pt-BR')} ha`;
      case 'percentage':
        return `${value.toLocaleString('pt-BR')}%`;
      default:
        return value.toString();
    }
  };

  const getPriorityLabel = (priority: string | undefined) => {
    switch (priority) {
      case 'low': return 'Baixa';
      case 'medium': return 'Média';
      case 'high': return 'Alta';
      default: return '';
    }
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Dados das tarefas por coluna
    const tasksData: any[] = [];
    
    board.columns.forEach(column => {
      column.cards.forEach(card => {
        const checklistCompleted = card.checklist ? card.checklist.filter(item => item.completed).length : 0;
        const checklistTotal = card.checklist ? card.checklist.length : 0;
        const attachmentsCount = card.attachments ? card.attachments.length : 0;

        tasksData.push({
          'Coluna': column.title,
          'Título da Tarefa': card.title,
          'Descrição': card.description || '',
          'Valor': card.value ? formatValue(card.value, card.valueType) : '',
          'Prioridade': getPriorityLabel(card.priority),
          'Checklist': checklistTotal > 0 ? `${checklistCompleted}/${checklistTotal}` : '',
          'Anexos': attachmentsCount > 0 ? attachmentsCount : '',
          'Criado em': formatDate(card.createdAt),
          'Atualizado em': formatDate(card.updatedAt)
        });
      });
    });

    // Planilha de Tarefas
    const tasksWorksheet = XLSX.utils.json_to_sheet(tasksData);
    XLSX.utils.book_append_sheet(workbook, tasksWorksheet, 'Tarefas');

    // Dados dos checklists detalhados
    const checklistData: any[] = [];
    
    board.columns.forEach(column => {
      column.cards.forEach(card => {
        if (card.checklist && card.checklist.length > 0) {
          card.checklist.forEach(item => {
            checklistData.push({
              'Coluna': column.title,
              'Tarefa': card.title,
              'Item do Checklist': item.text,
              'Status': item.completed ? 'Concluído' : 'Pendente'
            });
          });
        }
      });
    });

    // Planilha de Checklist (apenas se houver dados)
    if (checklistData.length > 0) {
      const checklistWorksheet = XLSX.utils.json_to_sheet(checklistData);
      XLSX.utils.book_append_sheet(workbook, checklistWorksheet, 'Checklist');
    }

    // Dados dos anexos
    const attachmentsData: any[] = [];
    
    board.columns.forEach(column => {
      column.cards.forEach(card => {
        if (card.attachments && card.attachments.length > 0) {
          card.attachments.forEach(attachment => {
            attachmentsData.push({
              'Coluna': column.title,
              'Tarefa': card.title,
              'Nome do Arquivo': attachment.name,
              'Tamanho': `${(attachment.size / 1024).toFixed(2)} KB`,
              'Tipo': attachment.type,
              'Upload em': formatDate(attachment.uploadedAt)
            });
          });
        }
      });
    });

    // Planilha de Anexos (apenas se houver dados)
    if (attachmentsData.length > 0) {
      const attachmentsWorksheet = XLSX.utils.json_to_sheet(attachmentsData);
      XLSX.utils.book_append_sheet(workbook, attachmentsWorksheet, 'Anexos');
    }

    // Resumo do projeto
    const summaryData = [
      {
        'Métrica': 'Total de Colunas',
        'Valor': board.columns.length
      },
      {
        'Métrica': 'Total de Tarefas',
        'Valor': board.columns.reduce((total, col) => total + col.cards.length, 0)
      },
      {
        'Métrica': 'Tarefas com Alta Prioridade',
        'Valor': board.columns.reduce((total, col) => 
          total + col.cards.filter(card => card.priority === 'high').length, 0)
      },
      {
        'Métrica': 'Total de Itens de Checklist',
        'Valor': board.columns.reduce((total, col) => 
          total + col.cards.reduce((cardTotal, card) => 
            cardTotal + (card.checklist ? card.checklist.length : 0), 0), 0)
      },
      {
        'Métrica': 'Itens de Checklist Concluídos',
        'Valor': board.columns.reduce((total, col) => 
          total + col.cards.reduce((cardTotal, card) => 
            cardTotal + (card.checklist ? card.checklist.filter(item => item.completed).length : 0), 0), 0)
      },
      {
        'Métrica': 'Total de Anexos',
        'Valor': board.columns.reduce((total, col) => 
          total + col.cards.reduce((cardTotal, card) => 
            cardTotal + (card.attachments ? card.attachments.length : 0), 0), 0)
      }
    ];

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumo');

    // Configurar larguras das colunas
    const columnWidths = [
      { wch: 20 }, // Coluna
      { wch: 30 }, // Título da Tarefa
      { wch: 50 }, // Descrição
      { wch: 15 }, // Valor
      { wch: 12 }, // Prioridade
      { wch: 12 }, // Checklist
      { wch: 8 },  // Anexos
      { wch: 12 }, // Criado em
      { wch: 12 }  // Atualizado em
    ];

    tasksWorksheet['!cols'] = columnWidths;

    // Gerar nome do arquivo com data
    const now = new Date();
    const timestamp = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const fileName = `${projectName.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

    // Fazer download do arquivo
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Button 
      onClick={exportToExcel}
      variant="outline"
      className="transition-organic hover:shadow-soft"
    >
      <FileSpreadsheet className="w-4 h-4 mr-2" />
      Exportar Excel
    </Button>
  );
};