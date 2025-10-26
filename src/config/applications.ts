import { Clock, Calendar, FileText, GraduationCap, ClipboardCheck, Shield, FolderOpen, LucideIcon } from 'lucide-react';

export interface Application {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  route?: string;
  status: 'active' | 'coming-soon';
  color: string;
  adminOnly?: boolean;
}

export const applications: Application[] = [
  {
    id: 'controle-ponto',
    name: 'Controle de Ponto',
    description: 'Sistema de gestão de ocorrências do ponto eletrônico',
    icon: Clock,
    route: '/apps/controle-ponto',
    color: 'hsl(140 86% 22%)',
    status: 'active',
  },
  {
    id: 'avaliacao',
    name: 'Avaliação de Aprendizes',
    description: 'Gerencie e realize avaliações de jovens aprendizes',
    icon: ClipboardCheck,
    route: '/apps/avaliacao',
    color: 'hsl(260 70% 50%)',
    status: 'active',
  },
  {
    id: 'ferias',
    name: 'Solicitação de Férias',
    description: 'Solicite e acompanhe suas férias',
    icon: Calendar,
    color: 'hsl(200 80% 40%)',
    status: 'coming-soon',
  },
  {
    id: 'holerite',
    name: 'Consulta de Holerite',
    description: 'Visualize e baixe seus holerites',
    icon: FileText,
    color: 'hsl(260 70% 50%)',
    status: 'coming-soon',
  },
  {
    id: 'treinamentos',
    name: 'Treinamentos',
    description: 'Acesse treinamentos e certificações',
    icon: GraduationCap,
    color: 'hsl(30 90% 50%)',
    status: 'coming-soon',
  },
  {
    id: 'sgdnc',
    name: 'Documentos e Conformidade',
    description: 'Gestão de documentos e não conformidades com rastreabilidade completa',
    icon: FolderOpen,
    route: '/apps/sgdnc',
    color: 'hsl(210 90% 45%)',
    status: 'active',
  },
  {
    id: 'admin',
    name: 'Administração',
    description: 'Gerencie usuários e permissões do sistema',
    icon: Shield,
    route: '/apps/admin',
    color: 'hsl(0 70% 50%)',
    status: 'active',
    adminOnly: true,
  },
];
