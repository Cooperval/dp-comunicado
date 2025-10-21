import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { mockAPI } from '@/services/mockData';
import { applications } from '@/config/applications';
import { useToast } from '@/hooks/use-toast';

const userSchema = z.object({
  matricula: z
    .string()
    .trim()
    .min(1, 'Matrícula é obrigatória')
    .max(20, 'Matrícula deve ter no máximo 20 caracteres'),
  name: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z
    .string()
    .trim()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(50, 'Senha deve ter no máximo 50 caracteres')
    .optional()
    .or(z.literal('')),
  role: z.enum(['admin', 'rh', 'gestor', 'dp'], {
    required_error: 'Selecione uma função',
  }),
  department: z
    .string()
    .trim()
    .min(1, 'Departamento é obrigatório')
    .max(100, 'Departamento deve ter no máximo 100 caracteres'),
  allowedApps: z.array(z.string()).min(1, 'Selecione pelo menos um aplicativo'),
});

type UserFormValues = z.infer<typeof userSchema>;

interface User {
  id: string;
  matricula: string;
  name: string;
  email: string;
  role: 'admin' | 'rh' | 'gestor' | 'dp';
  department: string;
  allowedApps: string[];
  active: boolean;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export function UserFormDialog({ open, onOpenChange, user, onSuccess }: UserFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!user;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      matricula: '',
      name: '',
      email: '',
      password: '',
      role: 'gestor',
      department: '',
      allowedApps: [],
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        matricula: user.matricula,
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        department: user.department,
        allowedApps: user.allowedApps,
      });
    } else {
      form.reset({
        matricula: '',
        name: '',
        email: '',
        password: '',
        role: 'gestor',
        department: '',
        allowedApps: [],
      });
    }
  }, [user, form]);

  const onSubmit = async (data: UserFormValues) => {
    try {
      const payload = {
        matricula: data.matricula.trim(),
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        role: data.role,
        department: data.department.trim(),
        allowedApps: data.allowedApps,
      };

      if (isEditing) {
        await mockAPI.updateUsuario(user.id, payload);
        toast({
          title: 'Sucesso',
          description: 'Usuário atualizado com sucesso',
        });
      } else {
        await mockAPI.createUsuario(payload);
        toast({
          title: 'Sucesso',
          description: 'Usuário criado com sucesso',
        });
      }

      onSuccess();
    } catch (error) {
      toast({
        title: 'Erro',
        description: `Não foi possível ${isEditing ? 'atualizar' : 'criar'} o usuário`,
        variant: 'destructive',
      });
    }
  };

  const availableApps = applications.filter((app) => app.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do usuário e suas permissões'
              : 'Adicione um novo usuário ao sistema e defina suas permissões'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="matricula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matrícula *</FormLabel>
                    <FormControl>
                      <Input placeholder="0001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="João da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="joao.silva@empresa.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Será usado como login do usuário</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>Mínimo de 8 caracteres</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="rh">RH</SelectItem>
                        <SelectItem value="gestor">Gestor</SelectItem>
                        <SelectItem value="dp">DP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento *</FormLabel>
                    <FormControl>
                      <Input placeholder="Recursos Humanos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="allowedApps"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Permissões de Acesso *</FormLabel>
                    <FormDescription>
                      Selecione quais aplicativos o usuário poderá acessar
                    </FormDescription>
                  </div>
                  <div className="space-y-3">
                    {availableApps.map((app) => (
                      <FormField
                        key={app.id}
                        control={form.control}
                        name="allowedApps"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={app.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(app.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, app.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== app.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="flex items-center gap-3 flex-1">
                                <div
                                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                                  style={{ backgroundColor: app.color, opacity: 0.9 }}
                                >
                                  <app.icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <FormLabel className="font-medium">
                                    {app.name}
                                  </FormLabel>
                                  <p className="text-sm text-muted-foreground">
                                    {app.description}
                                  </p>
                                </div>
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
