import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { getInitials } from '@/pages/apps/controle-financeiro/utils/formatters';
import { getPlanBadge } from '@/pages/apps/controle-financeiro/components/settings/PlanBadge';

interface Group {
  id: string;
  name: string;
  subscription_plan: 'free' | 'trial' | 'pro';
  subscription_status: 'active' | 'inactive' | 'canceled';
  trial_ends_at?: string | null;
  stripe_customer_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface PlansTabProps {
  onChangePlan: (groupId: string, newPlan: string) => void;
}

export function PlansTab({ onChangePlan }: PlansTabProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('name');

      if (error) throw error;
      setGroups((data || []) as Group[]);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSubscriptionActive = (group: Group) => {
    return group.subscription_status === 'active' && group.subscription_plan === 'pro';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Planos</CardTitle>
          <CardDescription>Visualize e gerencie os planos dos grupos</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Planos</CardTitle>
        <CardDescription>Visualize e gerencie os planos dos grupos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>{getInitials(group.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{group.name}</h3>
                    {isSubscriptionActive(group) && (
                      <Badge className="bg-success">Assinatura Ativa</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Grupo</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {getPlanBadge(group.subscription_plan, group.subscription_status, group.trial_ends_at)}

                <Select
                  value={group.subscription_plan}
                  onValueChange={(value) => onChangePlan(group.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          {groups.length === 0 && (
            <p className="text-muted-foreground text-center py-4">Nenhum grupo cadastrado</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
