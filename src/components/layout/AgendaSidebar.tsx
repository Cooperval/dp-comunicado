import { CalendarDays, Clock } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link, useLocation } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getCategorias, getEstatisticasMes, getProximosCompromissos } from '@/services/agendaLocalStorage';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function AgendaSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;
  const [date, setDate] = useState<Date>(new Date());

  const categorias = useMemo(() => getCategorias(), []);
  const estatisticas = useMemo(() => getEstatisticasMes(new Date()), []);
  const proximosCompromissos = useMemo(() => getProximosCompromissos(5), []);

  const menuItems = [
    {
      title: 'Dashboard',
      icon: CalendarDays,
      url: '/apps/agenda',
    },
  ];

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      // Você pode adicionar navegação para o dia específico aqui se desejar
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Mini Calendário */}
        <SidebarGroup>
          <SidebarGroupLabel>Calendário</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                className="rounded-md border"
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Estatísticas do Mês */}
        <SidebarGroup>
          <SidebarGroupLabel>Este Mês</SidebarGroupLabel>
          <SidebarGroupContent>
            <Card className="mx-2">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{estatisticas.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hoje</span>
                  <span className="font-semibold">{estatisticas.compromissosHoje}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Concluídos</span>
                  <span className="font-semibold">{estatisticas.concluidos}</span>
                </div>
              </CardContent>
            </Card>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Categorias */}
        <SidebarGroup>
          <SidebarGroupLabel>Categorias</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 space-y-2">
              {categorias.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.cor }}
                  />
                  <span className="text-sm">{cat.nome}</span>
                </div>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Próximos Compromissos */}
        <SidebarGroup>
          <SidebarGroupLabel>Próximos</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 space-y-2">
              {proximosCompromissos.length > 0 ? (
                proximosCompromissos.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-2 rounded-lg border text-sm hover:bg-accent cursor-pointer transition-colors"
                    style={{ borderLeftWidth: '3px', borderLeftColor: comp.cor }}
                  >
                    <div className="font-medium truncate">{comp.titulo}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(comp.data), "dd MMM", { locale: ptBR })} às {comp.horaInicio}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum compromisso próximo</p>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
