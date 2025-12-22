import { useState } from "react";
import { 
  UserPlus, 
  MoreVertical, 
  Mail, 
  Shield, 
  Edit2, 
  Trash2, 
  Send,
  User,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type ModuleRole = 'admin' | 'editor' | 'viewer';
type UserStatus = 'active' | 'pending' | 'suspended';

interface ModuleUser {
  id: string;
  name: string;
  email: string;
  role: ModuleRole;
  status: UserStatus;
  invitedAt: Date;
  accessGrantedAt?: Date;
}

const roleConfig: Record<ModuleRole, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: 'bg-destructive/20 text-destructive' },
  editor: { label: 'Editor', color: 'bg-primary/20 text-primary' },
  viewer: { label: 'Visualizador', color: 'bg-muted text-muted-foreground' },
};

const statusConfig: Record<UserStatus, { label: string; icon: React.ReactNode; color: string }> = {
  active: { label: 'Ativo', icon: <Shield className="w-3 h-3" />, color: 'bg-green-500/20 text-green-600' },
  pending: { label: 'Pendente', icon: <Clock className="w-3 h-3" />, color: 'bg-yellow-500/20 text-yellow-600' },
  suspended: { label: 'Suspenso', icon: <Shield className="w-3 h-3" />, color: 'bg-red-500/20 text-red-600' },
};

const mockUsers: ModuleUser[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@empresa.com',
    role: 'admin',
    status: 'active',
    invitedAt: new Date('2024-11-01'),
    accessGrantedAt: new Date('2024-11-01'),
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@empresa.com',
    role: 'editor',
    status: 'active',
    invitedAt: new Date('2024-12-05'),
    accessGrantedAt: new Date('2024-12-06'),
  },
  {
    id: '3',
    name: 'Pedro Lima',
    email: 'pedro@externa.com',
    role: 'viewer',
    status: 'pending',
    invitedAt: new Date('2024-12-20'),
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana@empresa.com',
    role: 'editor',
    status: 'suspended',
    invitedAt: new Date('2024-10-15'),
    accessGrantedAt: new Date('2024-10-16'),
  },
];

export const AccessControl = () => {
  const [users, setUsers] = useState<ModuleUser[]>(mockUsers);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ModuleRole>('viewer');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ModuleUser | null>(null);

  const activeUsers = users.filter(u => u.status === 'active');
  const pendingUsers = users.filter(u => u.status === 'pending');

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    if (users.some(u => u.email === inviteEmail)) {
      toast.error('Este email já possui acesso ao módulo');
      return;
    }

    const newUser: ModuleUser = {
      id: crypto.randomUUID(),
      name: 'Convite Pendente',
      email: inviteEmail,
      role: inviteRole,
      status: 'pending',
      invitedAt: new Date(),
    };

    setUsers([...users, newUser]);
    setInviteEmail('');
    toast.success(`Convite enviado para ${inviteEmail}`);
  };

  const handleResendInvite = (user: ModuleUser) => {
    toast.success(`Convite reenviado para ${user.email}`);
  };

  const handleChangeRole = (userId: string, newRole: ModuleRole) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    ));
    toast.success('Permissão atualizada');
  };

  const handleToggleSuspend = (user: ModuleUser) => {
    const newStatus: UserStatus = user.status === 'suspended' ? 'active' : 'suspended';
    setUsers(users.map(u => 
      u.id === user.id ? { ...u, status: newStatus } : u
    ));
    toast.success(newStatus === 'suspended' ? 'Usuário suspenso' : 'Usuário reativado');
  };

  const handleDeleteClick = (user: ModuleUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter(u => u.id !== userToDelete.id));
      toast.success('Acesso revogado');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const UserCard = ({ user }: { user: ModuleUser }) => (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary">
            {user.status === 'pending' ? <Mail className="w-4 h-4" /> : getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{user.name}</p>
            <Badge variant="secondary" className={roleConfig[user.role].color}>
              {roleConfig[user.role].label}
            </Badge>
            <Badge variant="secondary" className={statusConfig[user.status].color}>
              <span className="flex items-center gap-1">
                {statusConfig[user.status].icon}
                {statusConfig[user.status].label}
              </span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {user.accessGrantedAt 
              ? `Acesso desde: ${formatDate(user.accessGrantedAt)}`
              : `Convite enviado: ${formatDate(user.invitedAt)}`
            }
          </p>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-popover">
          {user.status === 'pending' && (
            <DropdownMenuItem onClick={() => handleResendInvite(user)}>
              <Send className="w-4 h-4 mr-2" />
              Reenviar convite
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'admin')}>
            <Shield className="w-4 h-4 mr-2" />
            Tornar Admin
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'editor')}>
            <Edit2 className="w-4 h-4 mr-2" />
            Tornar Editor
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'viewer')}>
            <User className="w-4 h-4 mr-2" />
            Tornar Visualizador
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.status !== 'pending' && (
            <DropdownMenuItem onClick={() => handleToggleSuspend(user)}>
              <Shield className="w-4 h-4 mr-2" />
              {user.status === 'suspended' ? 'Reativar' : 'Suspender'}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onClick={() => handleDeleteClick(user)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Revogar acesso
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="flex-1 p-6 gradient-earth">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Controle de Acesso
        </h1>
        <p className="text-muted-foreground">
          Gerencie quem pode acessar o módulo Fechamento
        </p>
      </div>

      {/* Invite Section */}
      <Card className="mb-6 border-border/50 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Convidar Usuário
          </CardTitle>
          <CardDescription>
            Envie um convite por email para adicionar novos usuários ao módulo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Input
              type="email"
              placeholder="email@empresa.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 min-w-[250px]"
            />
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as ModuleRole)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Permissão" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Visualizador</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleInvite} className="gap-2">
              <Send className="w-4 h-4" />
              Enviar Convite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card className="mb-6 border-border/50 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Usuários com Acesso ({activeUsers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum usuário ativo
            </p>
          ) : (
            activeUsers.map(user => (
              <UserCard key={user.id} user={user} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {pendingUsers.length > 0 && (
        <Card className="mb-6 border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Convites Pendentes ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingUsers.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Suspended Users */}
      {users.filter(u => u.status === 'suspended').length > 0 && (
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-5 h-5" />
              Usuários Suspensos ({users.filter(u => u.status === 'suspended').length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.filter(u => u.status === 'suspended').map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revogar Acesso</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o acesso de{' '}
              <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
              <br />
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Revogar Acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccessControl;