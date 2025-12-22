// src/utils/formatProjectionLog.ts

import { format, parseISO } from 'date-fns';


const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];


function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}


// Função auxiliar para formatar mês/ano bonito
function formatMonthYear(monthRef: string | undefined, year: number | undefined): string {
  if (!monthRef && !year) return 'desconhecido';

  let monthName = 'desconhecido';
  if (monthRef) {
    // Aceita formatos: "2026-01", "01", ou número
    const monthNum = parseInt(monthRef.toString().replace(/\D/g, ''), 10);
    if (monthNum >= 1 && monthNum <= 12) {
      monthName = monthNames[monthNum - 1];
    }
  }

  const y = year || new Date().getFullYear();
  return `${monthName}/${y}`;
}



function formatDate(dateStr?: string): string {
  if (!dateStr) return 'não informada';

  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy');
  } catch {
    return 'inválida';
  }
}


export function formatProjectionLogs(rawLogs: RawProjectionLog[]): ProjectionLog[] {
  return rawLogs.map((log) => {
    let oldData = log.OLD_DATA;
    let newData = log.NEW_DATA;

    const action = log.TIPO === 'INSERT' ? 'create' :
      log.TIPO === 'UPDATE' ? 'update' :
        log.TIPO === 'DELETE' ? 'delete' : 'delete';

    let description = '';
    let changes: string[] = [];
    

    if (action === 'create' && newData) {
      const projDate = formatDate(newData.data_projecao);

      description = `Criou projeção #${newData.id_projecao || 'nova'} para ${newData.mes_projecao || 'desconhecido'}`;
      changes.push(`Data da projeção: ${projDate}`);

    }

    else if (action === 'delete' && oldData) {
      const monthYear = formatMonthYear(oldData.mes_projecao || oldData.MES_PROJECAO,
        new Date(oldData.data_projecao || oldData.DATA_PROJECAO).getFullYear());
      const projDate = formatDate(oldData.data_projecao || oldData.DATA_PROJECAO);

      description = `Excluiu projeção #${oldData.id_projecao || oldData.ID_PROJECAO}`;
      changes.push(`Referente a: ${oldData.MES_PROJECAO}`);
      changes.push(`Data da projeção: ${projDate}`);
    }

    else if (action === 'update' && oldData && newData) {
      description = `Alterou projeção #${newData.id_projecao || oldData.ID_PROJECAO || 'desconhecida'}`;

      const fieldsToCheck = [
        'urbana', 'rural', 'mercadao', 'agroenergia', 'prolabore', 'total',
        'tipo', 'data_projecao', 'mes_projecao'
      ] as const;

      const fieldLabels: Record<string, string> = {
        urbana: 'Urbana',
        rural: 'Rural',
        mercadao: 'Mercadão',
        agroenergia: 'Agroenergia',
        prolabore: 'Prolabore',
        total: 'Total',
        tipo: 'Tipo',
        data_projecao: 'Data da Projeção',
        mes_projecao: 'Mês de Referência',
      };

      // Funções auxiliares para formatar campos específicos
      const formatTipo = (value: any): string => {
        if (value === undefined || value === null) return '-';
        const v = String(value).trim();
        return v === '1' ? 'Projeção' : v === '2' ? 'Realizado' : `Desconhecido (${v})`;
      };

      const formatDateProj = (dateStr: any): string => {
        if (!dateStr) return '-';

        try {
          return format(parseISO(String(dateStr)), 'dd/MM/yyyy');
        } catch {
          return 'Data inválida';
        }
      };

      const formatMonthRef = (monthRef: any): string => {
        if (!monthRef) return '-';
        const num = parseInt(String(monthRef).replace(/\D/g, ''), 10);
        if (num >= 1 && num <= 12) {
          return monthNames[num - 1];
        }
        return String(monthRef);
      };

      fieldsToCheck.forEach((field) => {
        let oldVal = oldData[field.toUpperCase()] ?? oldData[field];
        let newVal = newData[field.toUpperCase()] ?? newData[field];

        // Ignora se ambos são undefined/null
        if (oldVal === undefined && newVal === undefined) return;

        const label = fieldLabels[field] || field;

        let oldFormatted: string;
        let newFormatted: string;

        if (field === 'tipo') {
          oldFormatted = formatTipo(oldVal);
          newFormatted = formatTipo(newVal);
        } else if (field === 'data_projecao') {
          oldFormatted = formatDateProj(oldVal);
          newFormatted = formatDateProj(newVal);
        } else if (field === 'mes_projecao') {
          oldFormatted = formatMonthRef(oldVal);
          newFormatted = formatMonthRef(newVal);
        } else if (typeof newVal === 'number' || typeof oldVal === 'number') {
          oldFormatted = typeof oldVal === 'number' ? formatCurrency(oldVal) : '-';
          newFormatted = typeof newVal === 'number' ? formatCurrency(newVal) : '-';
        } else {
          oldFormatted = oldVal ?? '-';
          newFormatted = newVal ?? '-';
        }

        // Só adiciona se realmente mudou
        if (oldFormatted !== newFormatted) {
          changes.push(`• ${label}: ${oldFormatted} → ${newFormatted}`);
        }
      });

      if (changes.length === 0) {
        changes.push('• Alterações menores (ex: campos internos do sistema)');
      }
    }

    // Junta tudo em uma descrição rica
    const fullDescription = [description, ...changes].filter(Boolean).join('\n');

    return {
      id: log.ID_LOG,
      action,
      description: fullDescription,
      timestamp: log.CRIACAO,
    };
  })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}