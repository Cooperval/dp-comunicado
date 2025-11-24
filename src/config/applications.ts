import { Clock, GraduationCap, LucideIcon, ArrowUpDown, ClipboardCheck, ChartBarStacked, FileStack, DollarSign } from 'lucide-react';

export interface Application {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  route?: string;
  status: 'active' | 'coming-soon';
  color: string;
  cod_modulo?: number;
}

export const applications: Application[] = [
  {
    id: 'controle-ponto',
    name: 'Controle de Ponto',
    description: 'Sistema de gestão de ocorrências do ponto eletrônico',
    icon: Clock,
    route: '/apps/controle-ponto/ocorrencias',
    color: 'hsl(140 86% 22%)',
    status: 'active',
    cod_modulo: 13,
  },
  {
    id: 'fluxo-de-caixa',
    name: 'Fluxo de Caixa',
    description: 'Acompanhe as entradas e saídas financeiras',
    icon: ArrowUpDown,
    route: '/apps/fluxo-de-caixa',
    color: 'hsl(200 80% 40%)',
    status: 'active',
    cod_modulo: 12,
  },
  {
    id: 'simulador-cenarios',
    name: 'Simulador de Cenários',
    description: 'Realize simulações para planejamento estratégico',
    icon: ChartBarStacked,
    route: '/apps/simulador-cenarios/cotacoes',
    color: 'hsla(64, 56%, 56%, 1.00)',
    status: 'active',
    cod_modulo: 10,
  },

  {
    id: 'controle-financeiro',
    name: 'Controle Financeiro',
    description: 'Acompanhe as entradas e saídas financeiras',
    icon: DollarSign,
    route: '/apps/controle-financeiro',
    color: 'hsl(260 70% 50%)',
    status: 'active',
    cod_modulo: 16,
  },
  {
    id: 'fechamento',
    name: 'Fechamento',
    description: 'Acompanhe o processo de fechamento',
    icon: DollarSign,
    route: '/apps/fechamento',
    color: 'hsla(32, 70%, 50%, 1.00)',
    status: 'coming-soon',
    cod_modulo: 17,
  },
  {
    id: 'sgdnc',
    name: 'Gestão de Documentos e Não Conformidade',
    description: 'Acesse e gerencie documentos e não conformidades',
    icon: FileStack,
    route: '/apps/sgdnc',
    color: 'hsla(147, 90%, 50%, 1.00)',
    status: 'coming-soon',
    cod_modulo: 15,
  },
  {
    id: 'avaliacao',
    name: 'Avaliação de Aprendizes',
    description: 'Gerencie e realize avaliações de jovens aprendizes',
    icon: ClipboardCheck,
    route: '/apps/avaliacao',
    color: 'hsla(226, 85%, 44%, 1.00)',
    status: 'coming-soon',
    cod_modulo: 14,
  },

  // {
  //   id: 'treinamentos',
  //   name: 'Treinamentos',
  //   description: 'Acesse treinamentos e certificações',
  //   icon: GraduationCap,
  //   color: 'hsl(30 90% 50%)',
  //   status: 'coming-soon',
  //   cod_modulo: 4,
  // },


];
