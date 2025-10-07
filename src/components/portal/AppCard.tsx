import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AppCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  route?: string;
  status: 'active' | 'coming-soon';
  color: string;
}

export function AppCard({ name, description, icon: Icon, route, status, color }: AppCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (status === 'active' && route) {
      navigate(route);
    }
  };

  const isActive = status === 'active';

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 ${
        isActive
          ? 'cursor-pointer hover:scale-105 hover:shadow-medium'
          : 'opacity-60 cursor-not-allowed'
      }`}
      onClick={handleClick}
    >
      <div
        className="absolute inset-0 opacity-5"
        style={{ background: `linear-gradient(135deg, ${color}, transparent)` }}
      />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-lg"
            style={{ backgroundColor: color, opacity: 0.9 }}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
          {status === 'coming-soon' && (
            <Badge variant="secondary" className="text-xs">
              Em breve
            </Badge>
          )}
        </div>
        <CardTitle className="mt-4">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="relative">
        {isActive && (
          <p className="text-sm text-primary font-medium">
            Acessar aplicação →
          </p>
        )}
      </CardContent>
    </Card>
  );
}
