import { useState, useMemo } from 'react';
import { useOrganizationData } from '@/pages/apps/controle-financeiro/hooks/useOrganizationData';
import { useOrganizationOperations } from '@/pages/apps/controle-financeiro/hooks/useOrganizationOperations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Building, Building2, MapPin, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { CreateBranchDialog } from '@/pages/apps/controle-financeiro/components/settings/dialogs/CreateBranchDialog';
import { EditBranchDialog } from '@/pages/apps/controle-financeiro/components/settings/dialogs/EditBranchDialog';
import { DeleteBranchDialog } from '@/pages/apps/controle-financeiro/components/settings/dialogs/DeleteBranchDialog';
import { CreateCompanyDialog } from '@/pages/apps/controle-financeiro/components/settings/dialogs/CreateCompanyDialog';
import { EditCompanyDialog } from '@/pages/apps/controle-financeiro/components/settings/dialogs/EditCompanyDialog';
import { DeleteCompanyDialog } from '@/pages/apps/controle-financeiro/components/settings/dialogs/DeleteCompanyDialog';
import type { Branch, Company } from '@/pages/apps/controle-financeiro/hooks/useOrganizationData';

const Organization = () => {
  const { data, loading, refetch } = useOrganizationData();
  const operations = useOrganizationOperations(refetch);

  // Dialog states
  const [createBranchOpen, setCreateBranchOpen] = useState(false);
  const [editBranchOpen, setEditBranchOpen] = useState(false);
  const [deleteBranchOpen, setDeleteBranchOpen] = useState(false);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [deleteCompanyOpen, setDeleteCompanyOpen] = useState(false);

  // Selected items
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedCompanyForBranch, setSelectedCompanyForBranch] = useState<string>('');

  // Group branches by company
  const branchesByCompany = useMemo(() => {
    if (!data) return {};
    return data.branches.reduce((acc, branch) => {
      if (!acc[branch.company_id]) {
        acc[branch.company_id] = [];
      }
      acc[branch.company_id].push(branch);
      return acc;
    }, {} as Record<string, Branch[]>);
  }, [data]);

  const handleCreateCompany = () => {
    setCreateCompanyOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setEditCompanyOpen(true);
  };

  const handleDeleteCompany = (company: Company) => {
    setSelectedCompany(company);
    setDeleteCompanyOpen(true);
  };

  const handleCreateBranch = (companyId: string) => {
    const company = data?.companies.find(c => c.id === companyId);
    setSelectedCompanyForBranch(companyId);
    setSelectedCompany(company || null);
    setCreateBranchOpen(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setEditBranchOpen(true);
  };

  const handleDeleteBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setDeleteBranchOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erro ao carregar dados</CardTitle>
          <CardDescription>Não foi possível carregar os dados da organização.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                Minha Organização
              </CardTitle>
              <CardDescription>
                Gerencie as empresas e filiais do grupo <strong>{data.groupName}</strong>
              </CardDescription>
            </div>
            <Button onClick={handleCreateCompany} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.companies.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma empresa cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando sua primeira empresa para organizar suas filiais.
              </p>
              <Button onClick={handleCreateCompany}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Empresa
              </Button>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {data.companies.map((company) => {
                const companyBranches = branchesByCompany[company.id] || [];
                return (
                  <AccordionItem key={company.id} value={company.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-primary" />
                          <div className="text-left">
                            <p className="font-semibold">{company.name}</p>
                            {company.segment && (
                              <p className="text-sm text-muted-foreground">{company.segment}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateBranch(company.id);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCompany(company);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCompany(company);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-8 space-y-2">
                        {companyBranches.length === 0 ? (
                          <div className="text-center py-8 bg-muted/30 rounded-lg">
                            <MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-3">
                              Nenhuma filial nesta empresa
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateBranch(company.id)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Adicionar Filial
                            </Button>
                          </div>
                        ) : (
                          companyBranches.map((branch) => (
                            <div
                              key={branch.id}
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-primary" />
                                <div>
                                  <p className="font-medium">{branch.name}</p>
                                  {(branch.city || branch.state) && (
                                    <p className="text-sm text-muted-foreground">
                                      {branch.city}
                                      {branch.city && branch.state && ', '}
                                      {branch.state}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditBranch(branch)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBranch(branch)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {data.groupId && (
        <>
          <CreateCompanyDialog
            open={createCompanyOpen}
            groupId={data.groupId}
            groupName={data.groupName}
            onClose={() => setCreateCompanyOpen(false)}
            onSave={(companyData) => {
              operations.createCompany(companyData);
              setCreateCompanyOpen(false);
            }}
          />

          {selectedCompany && (
            <>
              <EditCompanyDialog
                open={editCompanyOpen}
                company={selectedCompany}
                onClose={() => setEditCompanyOpen(false)}
                onSave={(id, companyData) => {
                  operations.updateCompany(id, companyData);
                  setEditCompanyOpen(false);
                }}
              />

              <DeleteCompanyDialog
                open={deleteCompanyOpen}
                company={selectedCompany}
                onClose={() => setDeleteCompanyOpen(false)}
                onConfirm={() => {
                  operations.deleteCompany(selectedCompany.id, selectedCompany.name);
                  setDeleteCompanyOpen(false);
                }}
              />
            </>
          )}

          {selectedCompanyForBranch && selectedCompany && (
            <CreateBranchDialog
              open={createBranchOpen}
              companyId={selectedCompanyForBranch}
              companyName={selectedCompany.name}
              onClose={() => {
                setCreateBranchOpen(false);
                setSelectedCompanyForBranch('');
              }}
              onSave={(branchData) => {
                operations.createBranch(branchData);
                setCreateBranchOpen(false);
                setSelectedCompanyForBranch('');
              }}
            />
          )}

          {selectedBranch && (
            <>
              <EditBranchDialog
                open={editBranchOpen}
                branch={selectedBranch}
                onClose={() => setEditBranchOpen(false)}
                onSave={(id, branchData) => {
                  operations.updateBranch(id, branchData);
                  setEditBranchOpen(false);
                }}
              />

              <DeleteBranchDialog
                open={deleteBranchOpen}
                branch={selectedBranch}
                onClose={() => setDeleteBranchOpen(false)}
                onConfirm={() => {
                  operations.deleteBranch(selectedBranch.id, selectedBranch.name);
                  setDeleteBranchOpen(false);
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Organization;
