import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit2, Trash2, FolderTree, Check, MoreVertical, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/components/auth/controle-financeiro/AuthProvider";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
interface CommitmentGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  company_id: string | null;
  commitment_type_id?: string;
}
interface Commitment {
  id: string;
  commitment_group_id: string;
  commitment_type_id?: string;
  name: string;
  description: string;
  is_active: boolean;
  company_id: string | null;
}
interface CommitmentType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  company_id: string | null;
}
interface CommitmentHierarchyProps {
  selectedGroup?: string;
  selectedCommitment?: string;
  selectedType?: string;
  onSelectionChange: (group: string, commitment: string, type: string) => void;
  disabled?: boolean;
  showManagement?: boolean;
  showManagementExpanded?: boolean;
  onHierarchyChange?: () => void;
}
export const CommitmentHierarchy: React.FC<CommitmentHierarchyProps> = ({
  selectedGroup,
  selectedCommitment,
  selectedType,
  onSelectionChange,
  disabled = false,
  showManagement = false,
  showManagementExpanded = false,
  onHierarchyChange
}) => {
  const {
    profile
  } = useAuth();
  const [groups, setGroups] = useState<CommitmentGroup[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [commitmentTypes, setCommitmentTypes] = useState<CommitmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

  // Form states for creating new items
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    color: "#6B7280",
    commitment_type_id: ""
  });
  const [newCommitment, setNewCommitment] = useState({
    name: "",
    description: "",
    commitment_group_id: "",
    commitment_type_id: ""
  });
  const [newType, setNewType] = useState({
    name: "",
    description: ""
  });

  // Filtered groups for new commitment based on selected type
  const [filteredGroupsForNewCommitment, setFilteredGroupsForNewCommitment] = useState<CommitmentGroup[]>([]);
  
  // Filtered groups for editing commitment based on selected type
  const [filteredGroupsForEditCommitment, setFilteredGroupsForEditCommitment] = useState<CommitmentGroup[]>([]);

  // Universal checkboxes states
  const [isTypeUniversal, setIsTypeUniversal] = useState(true);
  const [isGroupUniversal, setIsGroupUniversal] = useState(true);
  const [isCommitmentUniversal, setIsCommitmentUniversal] = useState(true);

  // Edit states
  const [editingGroup, setEditingGroup] = useState<CommitmentGroup | null>(null);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [editingType, setEditingType] = useState<CommitmentType | null>(null);

  // Pagination and search states for Types
  const [typesSearchQuery, setTypesSearchQuery] = useState("");
  const [typesCurrentPage, setTypesCurrentPage] = useState(1);
  const [typesItemsPerPage, setTypesItemsPerPage] = useState(10);

  // Pagination and search states for Groups
  const [groupsSearchQuery, setGroupsSearchQuery] = useState("");
  const [groupsCurrentPage, setGroupsCurrentPage] = useState(1);
  const [groupsItemsPerPage, setGroupsItemsPerPage] = useState(10);

  // Pagination and search states for Commitments
  const [commitmentsSearchQuery, setCommitmentsSearchQuery] = useState("");
  const [commitmentsCurrentPage, setCommitmentsCurrentPage] = useState(1);
  const [commitmentsItemsPerPage, setCommitmentsItemsPerPage] = useState(10);
  useEffect(() => {
    fetchHierarchy();
  }, []);

  // Filter groups based on selected type for new commitment
  useEffect(() => {
    if (newCommitment.commitment_type_id) {
      const filtered = groups.filter(g => g.commitment_type_id === newCommitment.commitment_type_id);
      setFilteredGroupsForNewCommitment(filtered);
    } else {
      setFilteredGroupsForNewCommitment(groups);
    }
  }, [newCommitment.commitment_type_id, groups]);

  // Filter groups for editing commitment based on selected type
  useEffect(() => {
    if (editingCommitment?.commitment_type_id) {
      const filtered = groups.filter(g => g.commitment_type_id === editingCommitment.commitment_type_id);
      setFilteredGroupsForEditCommitment(filtered);
    } else {
      setFilteredGroupsForEditCommitment(groups);
    }
  }, [editingCommitment?.commitment_type_id, groups]);
  const fetchHierarchy = async () => {
    try {
      setLoading(true);

      // RLS policies já filtram automaticamente (universais + da empresa do usuário)
      const {
        data: groupsData,
        error: groupsError
      } = await supabase.from("commitment_groups").select("*").eq("is_active", true).order("name");
      if (groupsError) throw groupsError;
      setGroups(groupsData || []);
      const {
        data: commitmentsData,
        error: commitmentsError
      } = await supabase.from("commitments").select("*").eq("is_active", true).order("name");
      if (commitmentsError) throw commitmentsError;
      setCommitments(commitmentsData || []);
      const {
        data: typesData,
        error: typesError
      } = await supabase.from("commitment_types").select("*").eq("is_active", true).order("name");
      if (typesError) throw typesError;
      setCommitmentTypes(typesData || []);
    } catch (error) {
      console.error("Error fetching hierarchy:", error);
      toast({
        title: "Erro ao carregar hierarquia",
        description: "Não foi possível carregar os dados da hierarquia",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleGroupChange = (groupId: string) => {
    onSelectionChange(groupId, "", "");
  };
  const handleCommitmentChange = (commitmentId: string) => {
    onSelectionChange(selectedGroup || "", commitmentId, "");
  };
  const handleTypeChange = (typeId: string) => {
    onSelectionChange(selectedGroup || "", selectedCommitment || "", typeId);
  };
  const filteredCommitments = commitments.filter(c => c.commitment_group_id === selectedGroup);
  const filteredTypes = commitmentTypes;

  // Filtered and paginated Types
  const filteredAndPaginatedTypes = useMemo(() => {
    const filtered = commitmentTypes.filter(type =>
      type.name.toLowerCase().includes(typesSearchQuery.toLowerCase()) ||
      (type.description || "").toLowerCase().includes(typesSearchQuery.toLowerCase())
    );
    const totalPages = Math.ceil(filtered.length / typesItemsPerPage);
    const startIndex = (typesCurrentPage - 1) * typesItemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + typesItemsPerPage);
    return { items: paginated, total: filtered.length, totalPages };
  }, [commitmentTypes, typesSearchQuery, typesCurrentPage, typesItemsPerPage]);

  // Filtered and paginated Groups
  const filteredAndPaginatedGroups = useMemo(() => {
    const filtered = groups.filter(group =>
      group.name.toLowerCase().includes(groupsSearchQuery.toLowerCase()) ||
      (group.description || "").toLowerCase().includes(groupsSearchQuery.toLowerCase())
    );
    const totalPages = Math.ceil(filtered.length / groupsItemsPerPage);
    const startIndex = (groupsCurrentPage - 1) * groupsItemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + groupsItemsPerPage);
    return { items: paginated, total: filtered.length, totalPages };
  }, [groups, groupsSearchQuery, groupsCurrentPage, groupsItemsPerPage]);

  // Filtered and paginated Commitments
  const filteredAndPaginatedCommitments = useMemo(() => {
    const filtered = commitments.filter(commitment =>
      commitment.name.toLowerCase().includes(commitmentsSearchQuery.toLowerCase()) ||
      (commitment.description || "").toLowerCase().includes(commitmentsSearchQuery.toLowerCase())
    );
    const totalPages = Math.ceil(filtered.length / commitmentsItemsPerPage);
    const startIndex = (commitmentsCurrentPage - 1) * commitmentsItemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + commitmentsItemsPerPage);
    return { items: paginated, total: filtered.length, totalPages };
  }, [commitments, commitmentsSearchQuery, commitmentsCurrentPage, commitmentsItemsPerPage]);

  // Helper function to get company_id from authenticated user's profile
  const getCompanyId = async (): Promise<string> => {
    const {
      data: {
        user
      },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }
    const {
      data: profile,
      error: profileError
    } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).single();
    if (profileError || !profile?.company_id) {
      throw new Error("Empresa não encontrada no perfil do usuário");
    }
    return profile.company_id;
  };
  const createGroup = async () => {
    if (!newGroup.name.trim() || !newGroup.commitment_type_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e selecione o tipo do grupo",
        variant: "destructive"
      });
      return;
    }
    try {
      let company_id = null;

      // Se não for universal, buscar company_id do usuário
      if (!isGroupUniversal) {
        company_id = await getCompanyId();
      }
      const {
        error
      } = await supabase.from("commitment_groups").insert({
        company_id,
        name: newGroup.name,
        description: newGroup.description,
        color: newGroup.color,
        commitment_type_id: newGroup.commitment_type_id
      });
      if (error) throw error;
      await fetchHierarchy();
      onHierarchyChange?.();
      setNewGroup({
        name: "",
        description: "",
        color: "#6B7280",
        commitment_type_id: ""
      });
      setIsGroupUniversal(false);
      toast({
        title: "Grupo criado",
        description: "Grupo de natureza criado com sucesso"
      });
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Erro ao criar grupo",
        description: "Não foi possível criar o grupo",
        variant: "destructive"
      });
    }
  };
  const createCommitment = async () => {
    if (!newCommitment.name.trim() || !newCommitment.commitment_type_id || !newCommitment.commitment_group_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e selecione o tipo e grupo",
        variant: "destructive"
      });
      return;
    }
    try {
      let company_id = null;

      // Se não for universal, buscar company_id do usuário
      if (!isCommitmentUniversal) {
        company_id = await getCompanyId();
      }
      const {
        error
      } = await supabase.from("commitments").insert({
        commitment_group_id: newCommitment.commitment_group_id,
        commitment_type_id: newCommitment.commitment_type_id || null,
        company_id,
        name: newCommitment.name,
        description: newCommitment.description
      });
      if (error) throw error;
      await fetchHierarchy();
      onHierarchyChange?.();
      setNewCommitment({
        name: "",
        description: "",
        commitment_group_id: "",
        commitment_type_id: ""
      });
      setIsCommitmentUniversal(false);
      toast({
        title: "Natureza criada",
        description: "Natureza criada com sucesso"
      });
    } catch (error) {
      console.error("Error creating commitment:", error);
      toast({
        title: "Erro ao criar natureza",
        description: "Não foi possível criar a natureza",
        variant: "destructive"
      });
    }
  };
  const createType = async () => {
    if (!newType.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do tipo de natureza",
        variant: "destructive"
      });
      return;
    }
    try {
      let company_id = null;

      // Se não for universal, buscar company_id do usuário
      if (!isTypeUniversal) {
        company_id = await getCompanyId();
      }
      const {
        error
      } = await supabase.from("commitment_types").insert({
        company_id,
        name: newType.name,
        description: newType.description
      });
      if (error) throw error;
      await fetchHierarchy();
      onHierarchyChange?.();
      setNewType({
        name: "",
        description: ""
      });
      setIsTypeUniversal(false);
      toast({
        title: "Tipo criado",
        description: "Tipo de natureza criado com sucesso"
      });
    } catch (error) {
      console.error("Error creating type:", error);
      toast({
        title: "Erro ao criar tipo",
        description: "Não foi possível criar o tipo",
        variant: "destructive"
      });
    }
  };

  // Edit functions
  const updateGroup = async () => {
    if (!editingGroup || !editingGroup.name.trim() || !editingGroup.commitment_type_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e selecione o tipo do grupo",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        error
      } = await supabase.from("commitment_groups").update({
        name: editingGroup.name,
        description: editingGroup.description,
        color: editingGroup.color,
        commitment_type_id: editingGroup.commitment_type_id
      }).eq("id", editingGroup.id);
      if (error) throw error;
      await fetchHierarchy();
      onHierarchyChange?.();
      setEditingGroup(null);
      toast({
        title: "Grupo atualizado",
        description: "Grupo de natureza atualizado com sucesso"
      });
    } catch (error) {
      console.error("Error updating group:", error);
      toast({
        title: "Erro ao atualizar grupo",
        description: "Não foi possível atualizar o grupo",
        variant: "destructive"
      });
    }
  };
  const updateCommitment = async () => {
    if (!editingCommitment || !editingCommitment.name.trim() || !editingCommitment.commitment_group_id) {
      toast({
        title: "Dados incompletos",
        description: "Preencha o nome e selecione um grupo",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        error
      } = await supabase.from("commitments").update({
        commitment_group_id: editingCommitment.commitment_group_id,
        commitment_type_id: editingCommitment.commitment_type_id || null,
        name: editingCommitment.name,
        description: editingCommitment.description
      }).eq("id", editingCommitment.id);
      if (error) throw error;
      await fetchHierarchy();
      onHierarchyChange?.();
      setEditingCommitment(null);
      toast({
        title: "Natureza atualizada",
        description: "Natureza atualizada com sucesso"
      });
    } catch (error) {
      console.error("Error updating commitment:", error);
      toast({
        title: "Erro ao atualizar natureza",
        description: "Não foi possível atualizar a natureza",
        variant: "destructive"
      });
    }
  };
  const updateType = async () => {
    if (!editingType || !editingType.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do tipo de natureza",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        error
      } = await supabase.from("commitment_types").update({
        name: editingType.name,
        description: editingType.description
      }).eq("id", editingType.id);
      if (error) throw error;
      await fetchHierarchy();
      onHierarchyChange?.();
      setEditingType(null);
      toast({
        title: "Tipo atualizado",
        description: "Tipo de natureza atualizado com sucesso"
      });
    } catch (error) {
      console.error("Error updating type:", error);
      toast({
        title: "Erro ao atualizar tipo",
        description: "Não foi possível atualizar o tipo",
        variant: "destructive"
      });
    }
  };

  // Delete functions with validation
  const deleteGroup = async (groupId: string) => {
    try {
      // Check if there are commitments using this group
      const {
        data: commitmentsUsingGroup,
        error: checkError
      } = await supabase.from("commitments").select("id").eq("commitment_group_id", groupId).eq("is_active", true);
      if (checkError) throw checkError;
      if (commitmentsUsingGroup && commitmentsUsingGroup.length > 0) {
        toast({
          title: "Não é possível deletar",
          description: "Este grupo possui naturezas atreladas a ele",
          variant: "destructive"
        });
        return;
      }
      const {
        error
      } = await supabase.from("commitment_groups").update({
        is_active: false
      }).eq("id", groupId);
      if (error) throw error;
      await fetchHierarchy();
      onHierarchyChange?.();
      toast({
        title: "Grupo excluído",
        description: "Grupo de natureza excluído com sucesso"
      });
    } catch (error) {
      console.error("Error deleting group:", error);
      toast({
        title: "Erro ao excluir grupo",
        description: "Não foi possível excluir o grupo",
        variant: "destructive"
      });
    }
  };
  const deleteType = async (typeId: string) => {
    try {
      // Check if there are commitments using this type
      const {
        data: commitmentsUsingType,
        error: checkError
      } = await supabase.from("commitments").select("id").eq("commitment_type_id", typeId).eq("is_active", true);
      if (checkError) throw checkError;
      if (commitmentsUsingType && commitmentsUsingType.length > 0) {
        toast({
          title: "Não é possível deletar",
          description: "Este tipo possui naturezas atreladas a ele",
          variant: "destructive"
        });
        return;
      }
      const {
        error
      } = await supabase.from("commitment_types").update({
        is_active: false
      }).eq("id", typeId);
      if (error) throw error;
      await fetchHierarchy();
      onHierarchyChange?.();
      toast({
        title: "Tipo excluído",
        description: "Tipo de natureza excluído com sucesso"
      });
    } catch (error) {
      console.error("Error deleting type:", error);
      toast({
        title: "Erro ao excluir tipo",
        description: "Não foi possível excluir o tipo",
        variant: "destructive"
      });
    }
  };
  const deleteCommitment = async (commitmentId: string) => {
    try {
      const {
        error
      } = await supabase.from("commitments").update({
        is_active: false
      }).eq("id", commitmentId);
      if (error) throw error;
      await fetchHierarchy();
      onHierarchyChange?.();
      toast({
        title: "Natureza excluída",
        description: "Natureza excluída com sucesso"
      });
    } catch (error) {
      console.error("Error deleting commitment:", error);
      toast({
        title: "Erro ao excluir natureza",
        description: "Não foi possível excluir a natureza",
        variant: "destructive"
      });
    }
  };

  // Conteúdo das tabs de gerenciamento (usado tanto no modal quanto expandido)
  const hierarchyManagementContent = <Tabs defaultValue="types" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="types">Tipos</TabsTrigger>
        <TabsTrigger value="groups">Grupos</TabsTrigger>
        <TabsTrigger value="commitments">Naturezas</TabsTrigger>
      </TabsList>

      <TabsContent value="types" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Novo Tipo de Natureza</CardTitle>
            <CardDescription>Crie um novo tipo de natureza independente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="type-name">Nome</Label>
              <Input id="type-name" value={newType.name} onChange={e => setNewType(prev => ({
              ...prev,
              name: e.target.value
            }))} placeholder="Ex: Peças, Serviços" />
            </div>
            <div>
              <Label htmlFor="type-description">Descrição</Label>
              <Input id="type-description" value={newType.description} onChange={e => setNewType(prev => ({
              ...prev,
              description: e.target.value
            }))} placeholder="Descrição do tipo" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="type-universal" checked={isTypeUniversal} onCheckedChange={checked => setIsTypeUniversal(checked as boolean)} disabled={profile?.role !== "admin"} />
              <Label htmlFor="type-universal" className="text-sm font-normal cursor-pointer">
                Universal (visível para todas empresas)
                {profile?.role !== "admin" && <span className="text-xs text-muted-foreground ml-2">(Apenas admins)</span>}
              </Label>
            </div>
            <Button onClick={createType} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Criar Tipo
            </Button>
          </CardContent>
        </Card>

        {/* Pesquisa e controles de paginação */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar tipos..."
              value={typesSearchQuery}
              onChange={(e) => {
                setTypesSearchQuery(e.target.value);
                setTypesCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select value={String(typesItemsPerPage)} onValueChange={(value) => {
            setTypesItemsPerPage(Number(value));
            setTypesCurrentPage(1);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 itens</SelectItem>
              <SelectItem value="10">10 itens</SelectItem>
              <SelectItem value="25">25 itens</SelectItem>
              <SelectItem value="50">50 itens</SelectItem>
              <SelectItem value="100">100 itens</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de tipos existentes */}
        <div className="space-y-3">
          <div className="grid gap-2">
            {filteredAndPaginatedTypes.items.map(type => <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg">
                {editingType?.id === type.id ? <div className="flex-1 mr-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="edit-type-name">Nome</Label>
                        <Input id="edit-type-name" value={editingType.name} onChange={e => setEditingType(prev => prev ? {
                ...prev,
                name: e.target.value
              } : null)} placeholder="Nome do tipo" />
                      </div>
                      <div>
                        <Label htmlFor="edit-type-description">Descrição</Label>
                        <Input id="edit-type-description" value={editingType.description || ""} onChange={e => setEditingType(prev => prev ? {
                ...prev,
                description: e.target.value
              } : null)} placeholder="Descrição" />
                      </div>
                    </div>
                  </div> : <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium">{type.name}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </div>
                    {type.company_id === null && <Badge variant="outline" className="text-xs">
                        Universal
                      </Badge>}
                  </div>}
                <div className="flex gap-2">
                  {editingType?.id === type.id ? <>
                      <Button size="sm" onClick={updateType}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingType(null)}>
                        ×
                      </Button>
                    </> : <>
                      <Button size="sm" variant="outline" onClick={() => setEditingType(type)} disabled={type.company_id === null && profile?.role !== "admin"}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteType(type.id)} disabled={type.company_id === null && profile?.role !== "admin"}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>}
                </div>
              </div>)}
          </div>

          {/* Contador e paginação */}
          {filteredAndPaginatedTypes.total > 0 && (
            <>
              <div className="text-sm text-muted-foreground text-center">
                Mostrando {((typesCurrentPage - 1) * typesItemsPerPage) + 1}-{Math.min(typesCurrentPage * typesItemsPerPage, filteredAndPaginatedTypes.total)} de {filteredAndPaginatedTypes.total} itens
              </div>

              {filteredAndPaginatedTypes.totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setTypesCurrentPage(prev => Math.max(1, prev - 1))}
                        className={typesCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: filteredAndPaginatedTypes.totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === filteredAndPaginatedTypes.totalPages ||
                        (page >= typesCurrentPage - 1 && page <= typesCurrentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setTypesCurrentPage(page)}
                              isActive={page === typesCurrentPage}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (page === typesCurrentPage - 2 || page === typesCurrentPage + 2) {
                        return <PaginationEllipsis key={page} />;
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setTypesCurrentPage(prev => Math.min(filteredAndPaginatedTypes.totalPages, prev + 1))}
                        className={typesCurrentPage === filteredAndPaginatedTypes.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}

          {filteredAndPaginatedTypes.total === 0 && (
            <div className="text-center text-muted-foreground py-8">
              {typesSearchQuery ? "Nenhum tipo encontrado" : "Nenhum tipo cadastrado"}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="groups" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Novo Grupo de Natureza</CardTitle>
            <CardDescription>Crie um novo grupo de natureza (ex: Receitas, Despesas)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="group-type">
                Tipo de Natureza <span className="text-red-500">*</span>
              </Label>
              <Select value={newGroup.commitment_type_id} onValueChange={value => setNewGroup(prev => ({
              ...prev,
              commitment_type_id: value
            }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {commitmentTypes.map(type => <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

                <div>
                  <Label htmlFor="group-name">Nome</Label>
                  <Input id="group-name" value={newGroup.name} onChange={e => setNewGroup(prev => ({
              ...prev,
              name: e.target.value
            }))} placeholder="Ex: Receitas" />
                </div>
            <div>
              <Label htmlFor="group-description">Descrição</Label>
              <Input id="group-description" value={newGroup.description} onChange={e => setNewGroup(prev => ({
              ...prev,
              description: e.target.value
            }))} placeholder="Descrição do grupo" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="group-universal" checked={isGroupUniversal} onCheckedChange={checked => setIsGroupUniversal(checked as boolean)} disabled={profile?.role !== "admin"} />
              <Label htmlFor="group-universal" className="text-sm font-normal cursor-pointer">
                Universal (visível para todas empresas)
                {profile?.role !== "admin" && <span className="text-xs text-muted-foreground ml-2">(Apenas admins)</span>}
              </Label>
            </div>
            <Button onClick={createGroup} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Criar Grupo
            </Button>
          </CardContent>
        </Card>

        {/* Pesquisa e controles de paginação */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar grupos..."
              value={groupsSearchQuery}
              onChange={(e) => {
                setGroupsSearchQuery(e.target.value);
                setGroupsCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select value={String(groupsItemsPerPage)} onValueChange={(value) => {
            setGroupsItemsPerPage(Number(value));
            setGroupsCurrentPage(1);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 itens</SelectItem>
              <SelectItem value="10">10 itens</SelectItem>
              <SelectItem value="25">25 itens</SelectItem>
              <SelectItem value="50">50 itens</SelectItem>
              <SelectItem value="100">100 itens</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de grupos existentes */}
        <div className="space-y-3">
          <div className="grid gap-2">
            {filteredAndPaginatedGroups.items.map(group => <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                {editingGroup?.id === group.id ? <div className="flex-1 mr-2 space-y-2">
                    <div>
                      <Label htmlFor="edit-group-type">Tipo</Label>
                      <Select value={editingGroup.commitment_type_id || ""} onValueChange={value => setEditingGroup(prev => prev ? {
                  ...prev,
                  commitment_type_id: value
                } : null)}>
                        <SelectTrigger id="edit-group-type">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {commitmentTypes.map(type => <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="edit-group-name">Nome</Label>
                        <Input id="edit-group-name" value={editingGroup.name} onChange={e => setEditingGroup(prev => prev ? {
                  ...prev,
                  name: e.target.value
                } : null)} placeholder="Nome do grupo" />
                      </div>
                      <div>
                        <Label htmlFor="edit-group-description">Descrição</Label>
                        <Input id="edit-group-description" value={editingGroup.description || ""} onChange={e => setEditingGroup(prev => prev ? {
                  ...prev,
                  description: e.target.value
                } : null)} placeholder="Descrição" />
                      </div>
                    </div>
                  </div> : <div className="flex items-center gap-3">
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{group.name}</span>
                        {group.company_id === null && <Badge variant="outline" className="text-xs">
                            Universal
                          </Badge>}
                        {!group.commitment_type_id && <Badge variant="destructive" className="text-xs">
                            ⚠️ Tipo não definido
                          </Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {group.description}
                        {group.commitment_type_id && <span className="ml-2 text-xs">
                            • Tipo: {commitmentTypes.find(t => t.id === group.commitment_type_id)?.name}
                          </span>}
                      </div>
                    </div>
                  </div>}
                <div className="flex gap-2">
                  {editingGroup?.id === group.id ? <>
                      <Button size="sm" onClick={updateGroup}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingGroup(null)}>
                        ×
                      </Button>
                    </> : <>
                      <Button size="sm" variant="outline" onClick={() => setEditingGroup(group)} disabled={group.company_id === null && profile?.role !== "admin"}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteGroup(group.id)} disabled={group.company_id === null && profile?.role !== "admin"}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>}
                </div>
              </div>)}
          </div>

          {/* Contador e paginação */}
          {filteredAndPaginatedGroups.total > 0 && (
            <>
              <div className="text-sm text-muted-foreground text-center">
                Mostrando {((groupsCurrentPage - 1) * groupsItemsPerPage) + 1}-{Math.min(groupsCurrentPage * groupsItemsPerPage, filteredAndPaginatedGroups.total)} de {filteredAndPaginatedGroups.total} itens
              </div>

              {filteredAndPaginatedGroups.totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setGroupsCurrentPage(prev => Math.max(1, prev - 1))}
                        className={groupsCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: filteredAndPaginatedGroups.totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === filteredAndPaginatedGroups.totalPages ||
                        (page >= groupsCurrentPage - 1 && page <= groupsCurrentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setGroupsCurrentPage(page)}
                              isActive={page === groupsCurrentPage}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (page === groupsCurrentPage - 2 || page === groupsCurrentPage + 2) {
                        return <PaginationEllipsis key={page} />;
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setGroupsCurrentPage(prev => Math.min(filteredAndPaginatedGroups.totalPages, prev + 1))}
                        className={groupsCurrentPage === filteredAndPaginatedGroups.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}

          {filteredAndPaginatedGroups.total === 0 && (
            <div className="text-center text-muted-foreground py-8">
              {groupsSearchQuery ? "Nenhum grupo encontrado" : "Nenhum grupo cadastrado"}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="commitments" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Nova Natureza</CardTitle>
            <CardDescription>Crie uma nova natureza associada a um grupo e tipo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="commitment-type">
                Tipo de Natureza <span className="text-red-500">*</span>
              </Label>
              <Select value={newCommitment.commitment_type_id} onValueChange={value => setNewCommitment(prev => ({
              ...prev,
              commitment_type_id: value,
              commitment_group_id: "" // Reset grupo ao mudar tipo
            }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {commitmentTypes.map(type => <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="commitment-group">
                Grupo de Natureza <span className="text-red-500">*</span>
              </Label>
              <Select value={newCommitment.commitment_group_id} onValueChange={value => setNewCommitment(prev => ({
              ...prev,
              commitment_group_id: value
            }))} disabled={!newCommitment.commitment_type_id}>
                <SelectTrigger>
                  <SelectValue placeholder={!newCommitment.commitment_type_id ? "Selecione primeiro o tipo" : filteredGroupsForNewCommitment.length === 0 ? "Nenhum grupo disponível para este tipo" : "Selecione o grupo"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredGroupsForNewCommitment.length === 0 ? <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhum grupo disponível para este tipo
                    </div> : filteredGroupsForNewCommitment.map(group => <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{
                      backgroundColor: group.color
                    }} />
                          {group.name}
                        </div>
                      </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="commitment-name">Nome</Label>
              <Input id="commitment-name" value={newCommitment.name} onChange={e => setNewCommitment(prev => ({
              ...prev,
              name: e.target.value
            }))} placeholder="Ex: Aluguel, Vendas" />
            </div>
            <div>
              <Label htmlFor="commitment-description">Descrição</Label>
              <Input id="commitment-description" value={newCommitment.description} onChange={e => setNewCommitment(prev => ({
              ...prev,
              description: e.target.value
            }))} placeholder="Descrição da natureza" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="commitment-universal" checked={isCommitmentUniversal} onCheckedChange={checked => setIsCommitmentUniversal(checked as boolean)} disabled={profile?.role !== "admin"} />
              <Label htmlFor="commitment-universal" className="text-sm font-normal cursor-pointer">
                Universal (visível para todas empresas)
                {profile?.role !== "admin" && <span className="text-xs text-muted-foreground ml-2">(Apenas admins)</span>}
              </Label>
            </div>
            <Button onClick={createCommitment} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Criar Natureza
            </Button>
          </CardContent>
        </Card>

        {/* Pesquisa e controles de paginação */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar naturezas..."
              value={commitmentsSearchQuery}
              onChange={(e) => {
                setCommitmentsSearchQuery(e.target.value);
                setCommitmentsCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select value={String(commitmentsItemsPerPage)} onValueChange={(value) => {
            setCommitmentsItemsPerPage(Number(value));
            setCommitmentsCurrentPage(1);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 itens</SelectItem>
              <SelectItem value="10">10 itens</SelectItem>
              <SelectItem value="25">25 itens</SelectItem>
              <SelectItem value="50">50 itens</SelectItem>
              <SelectItem value="100">100 itens</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de naturezas existentes */}
        <div className="space-y-3">
          <div className="grid gap-2">
            {filteredAndPaginatedCommitments.items.map(commitment => {
            const group = groups.find(g => g.id === commitment.commitment_group_id);
            const type = commitmentTypes.find(t => t.id === commitment.commitment_type_id);
            return <div key={commitment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  {editingCommitment?.id === commitment.id ? <div className="flex-1 mr-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="edit-commitment-type">Tipo</Label>
                          <Select value={editingCommitment.commitment_type_id || "none"} onValueChange={value => setEditingCommitment(prev => prev ? {
                    ...prev,
                    commitment_type_id: value === "none" ? undefined : value,
                    commitment_group_id: value === "none" ? prev.commitment_group_id : ""
                  } : null)}>
                            <SelectTrigger id="edit-commitment-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum</SelectItem>
                              {commitmentTypes.map(t => <SelectItem key={t.id} value={t.id}>
                                  {t.name}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="edit-commitment-group">Grupo</Label>
                          <Select value={editingCommitment.commitment_group_id} onValueChange={value => setEditingCommitment(prev => prev ? {
                    ...prev,
                    commitment_group_id: value
                  } : null)} disabled={!editingCommitment.commitment_type_id}>
                            <SelectTrigger id="edit-commitment-group">
                              <SelectValue placeholder={!editingCommitment.commitment_type_id ? "Selecione primeiro o tipo" : "Selecione o grupo"} />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredGroupsForEditCommitment.length === 0 ? <div className="p-2 text-sm text-muted-foreground text-center">
                                  Nenhum grupo disponível para este tipo
                                </div> : filteredGroupsForEditCommitment.map(g => <SelectItem key={g.id} value={g.id}>
                                  {g.name}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="edit-commitment-name">Nome</Label>
                          <Input id="edit-commitment-name" value={editingCommitment.name} onChange={e => setEditingCommitment(prev => prev ? {
                    ...prev,
                    name: e.target.value
                  } : null)} placeholder="Nome" />
                        </div>
                        <div>
                          <Label htmlFor="edit-commitment-description">Descrição</Label>
                          <Input id="edit-commitment-description" value={editingCommitment.description || ""} onChange={e => setEditingCommitment(prev => prev ? {
                    ...prev,
                    description: e.target.value
                  } : null)} placeholder="Descrição" />
                        </div>
                      </div>
                    </div> : <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{commitment.name}</span>
                        {commitment.company_id === null && <Badge variant="outline" className="text-xs">
                            Universal
                          </Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {group?.name} {type && `• ${type.name}`}
                      </div>
                      {commitment.description && <div className="text-xs text-muted-foreground">{commitment.description}</div>}
                    </div>}
                  <div className="flex gap-2">
                    {editingCommitment?.id === commitment.id ? <>
                        <Button size="sm" onClick={updateCommitment}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCommitment(null)}>
                          ×
                        </Button>
                      </> : <>
                        <Button size="sm" variant="outline" onClick={() => setEditingCommitment(commitment)} disabled={commitment.company_id === null && profile?.role !== "admin"}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteCommitment(commitment.id)} disabled={commitment.company_id === null && profile?.role !== "admin"}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>}
                  </div>
                </div>;
          })}
          </div>

          {/* Contador e paginação */}
          {filteredAndPaginatedCommitments.total > 0 && (
            <>
              <div className="text-sm text-muted-foreground text-center">
                Mostrando {((commitmentsCurrentPage - 1) * commitmentsItemsPerPage) + 1}-{Math.min(commitmentsCurrentPage * commitmentsItemsPerPage, filteredAndPaginatedCommitments.total)} de {filteredAndPaginatedCommitments.total} itens
              </div>

              {filteredAndPaginatedCommitments.totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCommitmentsCurrentPage(prev => Math.max(1, prev - 1))}
                        className={commitmentsCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: filteredAndPaginatedCommitments.totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === filteredAndPaginatedCommitments.totalPages ||
                        (page >= commitmentsCurrentPage - 1 && page <= commitmentsCurrentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCommitmentsCurrentPage(page)}
                              isActive={page === commitmentsCurrentPage}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (page === commitmentsCurrentPage - 2 || page === commitmentsCurrentPage + 2) {
                        return <PaginationEllipsis key={page} />;
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCommitmentsCurrentPage(prev => Math.min(filteredAndPaginatedCommitments.totalPages, prev + 1))}
                        className={commitmentsCurrentPage === filteredAndPaginatedCommitments.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}

          {filteredAndPaginatedCommitments.total === 0 && (
            <div className="text-center text-muted-foreground py-8">
              {commitmentsSearchQuery ? "Nenhuma natureza encontrada" : "Nenhuma natureza cadastrada"}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>;
  if (loading) {
    return <div className="animate-pulse">Carregando hierarquia...</div>;
  }
  return <div className="space-y-4">
      {/* Botão de gerenciamento em modal */}
      {showManagement && !showManagementExpanded && <div className="flex justify-end">
          <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderTree className="w-4 h-4 mr-2" />
                Gerenciar Hierarquia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gerenciar Hierarquia de Naturezas</DialogTitle>
                <DialogDescription>Crie e gerencie grupos, naturezas e tipos de natureza</DialogDescription>
              </DialogHeader>

              {hierarchyManagementContent}
            </DialogContent>
          </Dialog>
        </div>}

      {/* Gerenciamento expandido (sem modal) */}
      {showManagementExpanded && <div className="w-full">{hierarchyManagementContent}</div>}
    </div>;
};
export default CommitmentHierarchy;