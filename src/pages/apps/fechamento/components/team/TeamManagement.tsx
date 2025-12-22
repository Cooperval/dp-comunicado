import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { User, UserRole, Project } from '@/pages/apps/fechamento/types';
import { CreateUserModal } from './CreateUserModal';
import { EditUserModal } from './EditUserModal';
import { ProjectAssignmentModal } from './ProjectAssignmentModal';
import { MoreHorizontal, Plus, UserPlus, Settings, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamManagementProps {
  users: User[];
  projects: Project[];
  onCreateUser: (userData: Omit<User, 'id'>) => void;
  onUpdateUser: (userId: string, userData: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string, active: boolean) => void;
  onUpdateProjectMembers: (projectId: string, members: User[]) => void;
}

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'manager':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'collaborator':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'manager':
      return 'Gestor';
    case 'collaborator':
      return 'Colaborador';
    default:
      return role;
  }
};

export const TeamManagement = ({
  users,
  projects,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onToggleUserStatus,
  onUpdateProjectMembers,
}: TeamManagementProps) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [projectAssignmentOpen, setProjectAssignmentOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  const handleCreateUser = (userData: Omit<User, 'id'>) => {
    onCreateUser(userData);
    setCreateModalOpen(false);
    toast({
      title: "Usuário criado",
      description: "O usuário foi criado com sucesso.",
    });
  };

  const handleUpdateUser = (userData: Partial<User>) => {
    if (selectedUser) {
      onUpdateUser(selectedUser.id, userData);
      setEditModalOpen(false);
      setSelectedUser(null);
      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso.",
      });
    }
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      onDeleteUser(selectedUser.id);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });
    }
  };

  const handleToggleStatus = (user: User) => {
    const newStatus = !(user as any).active;
    onToggleUserStatus(user.id, newStatus);
    toast({
      title: newStatus ? "Usuário ativado" : "Usuário desativado",
      description: `O usuário foi ${newStatus ? 'ativado' : 'desativado'} com sucesso.`,
    });
  };

  const getUserProjects = (userId: string) => {
    return projects.filter(project => 
      project.members.some(member => member.id === userId)
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gerenciar Compartilhamento
          </h1>
          <p className="text-muted-foreground">
            Gerencie usuários e suas permissões nos projetos
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Adicionar Usuário
        </Button>
      </div>

      <div className="grid gap-4">
        {users.map((user) => {
          const userProjects = getUserProjects(user.id);
          const isActive = (user as any).active !== false;
          
          return (
            <Card key={user.id} className={`transition-all ${!isActive ? 'opacity-60' : ''}`}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{user.name}</h3>
                      {!isActive && <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {userProjects.length} projeto(s)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setProjectAssignmentOpen(true);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Projetos
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user);
                          setEditModalOpen(true);
                        }}
                      >
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(user)}
                      >
                        {isActive ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum usuário cadastrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece adicionando o primeiro usuário da sua equipe
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              Adicionar Primeiro Usuário
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateUserModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateUser={handleCreateUser}
      />

      {selectedUser && (
        <EditUserModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          user={selectedUser}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {selectedUser && (
        <ProjectAssignmentModal
          open={projectAssignmentOpen}
          onOpenChange={setProjectAssignmentOpen}
          user={selectedUser}
          projects={projects}
          onUpdateProjectMembers={onUpdateProjectMembers}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário "{selectedUser?.name}"? 
              Esta ação não pode ser desfeita e o usuário será removido de todos os projetos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};