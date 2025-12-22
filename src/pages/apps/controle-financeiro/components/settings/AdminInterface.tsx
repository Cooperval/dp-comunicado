import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, User, Settings as SettingsIcon } from 'lucide-react';
import { useSettingsData } from '@/pages/apps/controle-financeiro/hooks/useSettingsData';
import { useAdminOperations } from '@/pages/apps/controle-financeiro/hooks/useAdminOperations';
import { OrganizationTab } from './tabs/admin/OrganizationTab';
import { UsersTab } from './tabs/admin/UsersTab';
import { CreateTab } from './tabs/admin/CreateTab';
import { EditCompanyDialog } from './dialogs/EditCompanyDialog';
import { EditUserDialog } from './dialogs/EditUserDialog';
import { DeleteUserDialog } from './dialogs/DeleteUserDialog';
import { EditGroupDialog } from './dialogs/EditGroupDialog';
import { DeleteGroupDialog } from './dialogs/DeleteGroupDialog';
import { CreateBranchDialog } from './dialogs/CreateBranchDialog';
import { EditBranchDialog } from './dialogs/EditBranchDialog';
import { DeleteBranchDialog } from './dialogs/DeleteBranchDialog';
import { CreateCompanyDialog } from './dialogs/CreateCompanyDialog';
import { DeleteCompanyDialog } from './dialogs/DeleteCompanyDialog';
import { Company, UserProfile, Group, Branch } from '@/pages/apps/controle-financeiro/hooks/useSettingsData';
import { useAuth } from '@/pages/apps/controle-financeiro/auth/AuthProvider';

export function AdminInterface() {
  const { user } = useAuth();
  const { companies, groups, branches, users, refetch } = useSettingsData();
  const operations = useAdminOperations(refetch);

  // Estados para grupos
  const [editGroupDialog, setEditGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deleteGroupDialog, setDeleteGroupDialog] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

  // Estados para filiais
  const [createBranchDialog, setCreateBranchDialog] = useState(false);
  const [selectedGroupForBranch, setSelectedGroupForBranch] = useState<{ id: string; name: string } | null>(null);
  const [editBranchDialog, setEditBranchDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deleteBranchDialog, setDeleteBranchDialog] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);

  // Estados para empresas
  const [createCompanyDialog, setCreateCompanyDialog] = useState(false);
  const [selectedBranchForCompany, setSelectedBranchForCompany] = useState<{ id: string; name: string } | null>(null);
  const [editCompanyDialog, setEditCompanyDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteCompanyDialog, setDeleteCompanyDialog] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  // Estados para usuários
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  // Handlers para grupos
  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setEditGroupDialog(true);
  };

  const handleSaveGroup = (id: string, data: { name: string; description?: string }) => {
    operations.updateGroup(id, data);
    setEditGroupDialog(false);
  };

  const handleDeleteGroupClick = (group: Group) => {
    setDeletingGroup(group);
    setDeleteGroupDialog(true);
  };

  const handleConfirmDeleteGroup = () => {
    if (deletingGroup) {
      operations.deleteGroup(deletingGroup.id, deletingGroup.name);
      setDeleteGroupDialog(false);
    }
  };

  // Handlers para filiais (agora vinculadas a empresas)
  const handleCreateBranch = (companyId: string, companyName: string) => {
    setSelectedGroupForBranch({ id: companyId, name: companyName });
    setCreateBranchDialog(true);
  };

  const handleSaveNewBranch = (data: { name: string; description?: string; city?: string; state?: string; company_id: string }) => {
    operations.createBranch(data);
    setCreateBranchDialog(false);
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setEditBranchDialog(true);
  };

  const handleSaveBranch = (id: string, data: { name: string; description?: string; city?: string; state?: string }) => {
    operations.updateBranch(id, data);
    setEditBranchDialog(false);
  };

  const handleDeleteBranchClick = (branch: Branch) => {
    setDeletingBranch(branch);
    setDeleteBranchDialog(true);
  };

  const handleConfirmDeleteBranch = () => {
    if (deletingBranch) {
      operations.deleteBranch(deletingBranch.id, deletingBranch.name);
      setDeleteBranchDialog(false);
    }
  };

  // Handlers para empresas (agora vinculadas a grupos)
  const handleCreateCompany = (groupId: string, groupName: string) => {
    setSelectedBranchForCompany({ id: groupId, name: groupName });
    setCreateCompanyDialog(true);
  };

  const handleSaveNewCompany = (data: { name: string; segment: string; group_id: string }) => {
    operations.createCompany(data);
    setCreateCompanyDialog(false);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setEditCompanyDialog(true);
  };

  const handleSaveCompany = (id: string, data: { name: string; segment: string }) => {
    operations.updateCompany(id, data);
    setEditCompanyDialog(false);
  };

  const handleDeleteCompanyClick = (company: Company) => {
    setDeletingCompany(company);
    setDeleteCompanyDialog(true);
  };

  const handleConfirmDeleteCompany = () => {
    if (deletingCompany) {
      operations.deleteCompany(deletingCompany.id, deletingCompany.name);
      setDeleteCompanyDialog(false);
    }
  };

  // Handlers para usuários
  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditUserDialog(true);
  };

  const handleSaveUser = async (
    userId: string,
    profileId: string,
    data: { full_name: string; role: any; group_id: string; company_id: string | null },
    newPassword?: string
  ) => {
    await operations.updateUser(userId, profileId, data);
    
    if (newPassword) {
      await operations.updateUserPassword(userId, newPassword);
    }
    
    setEditUserDialog(false);
  };

  const handleDeleteUserClick = (user: UserProfile) => {
    setDeletingUser(user);
    setDeleteUserDialog(true);
  };

  const handleConfirmDeleteUser = () => {
    if (deletingUser) {
      operations.deleteUser(deletingUser.user_id, deletingUser.id, deletingUser.full_name, user?.id);
      setDeleteUserDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="groups" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Grupos
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            Cadastros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups">
          <OrganizationTab
            groups={groups}
            branches={branches}
            companies={companies}
            onEditGroup={handleEditGroup}
            onDeleteGroup={handleDeleteGroupClick}
            onCreateBranch={handleCreateBranch}
            onEditBranch={handleEditBranch}
            onDeleteBranch={handleDeleteBranchClick}
            onCreateCompany={handleCreateCompany}
            onEditCompany={handleEditCompany}
            onDeleteCompany={handleDeleteCompanyClick}
            onChangePlan={operations.changePlan}
          />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab
            users={users}
            groups={groups}
            onEdit={handleEditUser}
            onDelete={handleDeleteUserClick}
          />
        </TabsContent>

        <TabsContent value="create">
          <CreateTab
            groups={groups}
            onCreateGroup={operations.createGroup}
            onCreateUser={operations.createUser}
          />
        </TabsContent>
      </Tabs>

      <EditGroupDialog
        open={editGroupDialog}
        group={editingGroup}
        onClose={() => setEditGroupDialog(false)}
        onSave={handleSaveGroup}
      />

      <DeleteGroupDialog
        open={deleteGroupDialog}
        group={deletingGroup}
        onClose={() => setDeleteGroupDialog(false)}
        onConfirm={handleConfirmDeleteGroup}
      />

      <CreateBranchDialog
        open={createBranchDialog}
        companyId={selectedGroupForBranch?.id || null}
        companyName={selectedGroupForBranch?.name || ''}
        onClose={() => setCreateBranchDialog(false)}
        onSave={handleSaveNewBranch}
      />

      <EditBranchDialog
        open={editBranchDialog}
        branch={editingBranch}
        onClose={() => setEditBranchDialog(false)}
        onSave={handleSaveBranch}
      />

      <DeleteBranchDialog
        open={deleteBranchDialog}
        branch={deletingBranch}
        onClose={() => setDeleteBranchDialog(false)}
        onConfirm={handleConfirmDeleteBranch}
      />

      <CreateCompanyDialog
        open={createCompanyDialog}
        groupId={selectedBranchForCompany?.id || null}
        groupName={selectedBranchForCompany?.name || ''}
        onClose={() => setCreateCompanyDialog(false)}
        onSave={handleSaveNewCompany}
      />

      <EditCompanyDialog
        open={editCompanyDialog}
        company={editingCompany}
        onClose={() => setEditCompanyDialog(false)}
        onSave={handleSaveCompany}
      />

      <DeleteCompanyDialog
        open={deleteCompanyDialog}
        company={deletingCompany}
        onClose={() => setDeleteCompanyDialog(false)}
        onConfirm={handleConfirmDeleteCompany}
      />

      <EditUserDialog
        open={editUserDialog}
        user={editingUser}
        groups={groups}
        onClose={() => setEditUserDialog(false)}
        onSave={handleSaveUser}
      />

      <DeleteUserDialog
        open={deleteUserDialog}
        user={deletingUser}
        currentUserId={user?.id}
        onClose={() => setDeleteUserDialog(false)}
        onConfirm={handleConfirmDeleteUser}
      />
    </div>
  );
}
