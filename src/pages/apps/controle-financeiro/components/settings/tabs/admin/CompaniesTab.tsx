import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { Company } from '@/pages/apps/controle-financeiro/hooks/useSettingsData';
import { getPlanBadge } from '@/pages/apps/controle-financeiro/components/settings/PlanBadge';
import { EditCompanyDialog } from '@/pages/apps/controle-financeiro/components/settings/dialogs/EditCompanyDialog';

interface CompaniesTabProps {
  companies: Company[];
  onCompanyClick: (companyId: string) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}

export function CompaniesTab({ companies, onCompanyClick, onEdit, onDelete }: CompaniesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Empresas Cadastradas</CardTitle>
        <CardDescription>Lista de todas as empresas na plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {companies.map((company) => (
            <div
              key={company.id}
              className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onCompanyClick(company.id)}
            >
              <div className="flex items-center gap-4 flex-1">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{company.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {company.segment || 'Não informado'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(company);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(company);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {companies.length === 0 && (
            <p className="text-muted-foreground text-center py-4">Nenhuma empresa cadastrada</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
