import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin } from 'lucide-react';
import { Company, Branch } from '@/pages/apps/controle-financeiro/hooks/useOrganizationData';

interface CompanyBranchFilterProps {
  companies: Company[];
  branches: Branch[];
  selectedCompanyId: string;
  selectedBranchId: string;
  onCompanyChange: (companyId: string) => void;
  onBranchChange: (branchId: string) => void;
  loading?: boolean;
}

export function CompanyBranchFilter({
  companies,
  branches,
  selectedCompanyId,
  selectedBranchId,
  onCompanyChange,
  onBranchChange,
  loading = false,
}: CompanyBranchFilterProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {/* Filtro de Empresa */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Select
          value={selectedCompanyId || undefined}
          onValueChange={onCompanyChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Todas as empresas" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtro de Filial */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Select
          value={selectedBranchId || undefined}
          onValueChange={onBranchChange}
          disabled={loading || !selectedCompanyId || branches.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Todas as filiais" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
                {branch.city && ` - ${branch.city}/${branch.state}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
