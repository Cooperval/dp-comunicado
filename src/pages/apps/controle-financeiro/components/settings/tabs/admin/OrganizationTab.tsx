import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, Building2, Building, Store, RefreshCw, Loader2 } from 'lucide-react';
import { Company, Group, Branch } from '@/pages/apps/controle-financeiro/hooks/useSettingsData';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPlanBadge, getStripeBadge, getStripeDetails, StripeStatus } from '@/pages/apps/controle-financeiro/components/settings/PlanBadge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrganizationTabProps {
  groups: Group[];
  branches: Branch[];
  companies: Company[];
  onEditGroup: (group: Group) => void;
  onDeleteGroup: (group: Group) => void;
  onCreateBranch: (companyId: string, companyName: string) => void;
  onEditBranch: (branch: Branch) => void;
  onDeleteBranch: (branch: Branch) => void;
  onCreateCompany: (groupId: string, groupName: string) => void;
  onEditCompany: (company: Company) => void;
  onDeleteCompany: (company: Company) => void;
  onChangePlan?: (groupId: string, newPlan: string) => void;
}

export function OrganizationTab({
  groups,
  branches,
  companies,
  onEditGroup,
  onDeleteGroup,
  onCreateBranch,
  onEditBranch,
  onDeleteBranch,
  onCreateCompany,
  onEditCompany,
  onDeleteCompany,
  onChangePlan,
}: OrganizationTabProps) {
  const { toast } = useToast();
  const [stripeStatuses, setStripeStatuses] = useState<Record<string, StripeStatus>>({});
  const [verifyingStripe, setVerifyingStripe] = useState(false);

  const companiesByGroup = useMemo(() => {
    return companies.reduce((acc, company) => {
      if (!acc[company.group_id]) acc[company.group_id] = [];
      acc[company.group_id].push(company);
      return acc;
    }, {} as Record<string, Company[]>);
  }, [companies]);

  const branchesByCompany = useMemo(() => {
    return branches.reduce((acc, branch) => {
      if (!acc[branch.company_id]) acc[branch.company_id] = [];
      acc[branch.company_id].push(branch);
      return acc;
    }, {} as Record<string, Branch[]>);
  }, [branches]);

  const handleVerifyStripe = async () => {
    if (groups.length === 0) return;

    setVerifyingStripe(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Sessão não encontrada');
      }

      const { data, error } = await supabase.functions.invoke('check-groups-stripe-status', {
        body: { group_ids: groups.map(g => g.id) },
      });

      if (error) throw error;

      const statusMap: Record<string, StripeStatus> = {};
      for (const status of data.statuses || []) {
        statusMap[status.group_id] = status;
      }
      setStripeStatuses(statusMap);

      toast({
        title: 'Verificação concluída',
        description: `Status do Stripe verificado para ${groups.length} grupo(s)`,
      });
    } catch (error: any) {
      console.error('Error verifying Stripe:', error);
      toast({
        title: 'Erro ao verificar Stripe',
        description: error.message || 'Não foi possível verificar o status do Stripe',
        variant: 'destructive',
      });
    } finally {
      setVerifyingStripe(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Grupos</CardTitle>
            <CardDescription>Gestão de Grupos, Empresas, Filiais e Planos</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerifyStripe}
            disabled={verifyingStripe || groups.length === 0}
          >
            {verifyingStripe ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verificar Stripe
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum grupo cadastrado</p>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {groups.map((group) => {
              const stripeStatus = stripeStatuses[group.id];
              const stripeDetails = getStripeDetails(stripeStatus);
              
              return (
                <AccordionItem key={group.id} value={group.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{group.name}</span>
                            {getPlanBadge(
                              group.subscription_plan as 'free' | 'trial' | 'pro',
                              group.subscription_status as 'active' | 'inactive' | 'canceled',
                              group.trial_ends_at
                            )}
                            {getStripeBadge(stripeStatus)}
                          </div>
                          <div className="flex flex-col">
                            {group.description && (
                              <p className="text-sm text-muted-foreground">{group.description}</p>
                            )}
                            {stripeDetails && (
                              <p className="text-xs text-muted-foreground">{stripeDetails}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {onChangePlan && (
                          <Select
                            value={group.subscription_plan}
                            onValueChange={(value) => onChangePlan(group.id, value)}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="trial">Trial</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCreateCompany(group.id, group.name)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Empresa
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEditGroup(group)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteGroup(group)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-3">
                    {!companiesByGroup[group.id] || companiesByGroup[group.id].length === 0 ? (
                      <div className="ml-8 text-sm text-muted-foreground py-2">
                        Nenhuma empresa cadastrada
                      </div>
                    ) : (
                      companiesByGroup[group.id].map((company) => (
                        <Collapsible key={company.id} className="ml-4">
                          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                            <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                              <Building className="h-4 w-4 text-primary" />
                              <div>
                                <span className="font-medium">{company.name}</span>
                                {company.segment && (
                                  <span className="text-sm text-muted-foreground ml-2">
                                    ({company.segment})
                                  </span>
                                )}
                              </div>
                            </CollapsibleTrigger>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onCreateBranch(company.id, company.name)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Filial
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => onEditCompany(company)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDeleteCompany(company)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <CollapsibleContent className="pt-3 pl-8 space-y-2">
                            {!branchesByCompany[company.id] || branchesByCompany[company.id].length === 0 ? (
                              <div className="text-sm text-muted-foreground py-2">
                                Nenhuma filial cadastrada
                              </div>
                            ) : (
                              branchesByCompany[company.id].map((branch) => (
                                <div
                                  key={branch.id}
                                  className="flex items-center justify-between p-3 border rounded-lg bg-background"
                                >
                                  <div className="flex items-center gap-2">
                                    <Store className="h-4 w-4 text-primary" />
                                    <div>
                                      <span className="font-medium">{branch.name}</span>
                                      {(branch.city || branch.state) && (
                                        <span className="text-sm text-muted-foreground ml-2">
                                          ({branch.city}{branch.city && branch.state && '/'}{branch.state})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onEditBranch(branch)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onDeleteBranch(branch)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      ))
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
