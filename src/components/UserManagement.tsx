import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const UserManagement = () => {
  const { allUsers, addUser, updateUser, updateUserPassword, removeUser } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    name: '',
    type: 'transportadora' as 'admin' | 'transportadora' | 'portaria',
    maxPlates: 10,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    type: 'transportadora' as 'admin' | 'transportadora' | 'portaria',
    maxPlates: 10,
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addUser(
        createForm.username,
        createForm.password,
        createForm.name,
        createForm.type,
        createForm.type === 'transportadora' ? createForm.maxPlates : undefined
      );
      toast.success(`Usuário "${createForm.name}" criado com sucesso! As alterações foram salvas permanentemente.`);
      setIsCreateDialogOpen(false);
      setCreateForm({
        username: '',
        password: '',
        name: '',
        type: 'transportadora',
        maxPlates: 10,
      });
    } catch (error) {
      console.error('Erro detalhado ao criar usuário:', error);
      toast.error(`Erro ao criar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);

    try {
      await updateUser(selectedUser.id, {
        name: editForm.name,
        type: editForm.type,
        maxPlates: editForm.type === 'transportadora' ? editForm.maxPlates : undefined,
      });
      toast.success(`Usuário "${editForm.name}" atualizado com sucesso! As alterações foram salvas permanentemente.`);
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Erro detalhado ao atualizar usuário:', error);
      toast.error(`Erro ao atualizar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);

    try {
      await updateUserPassword(selectedUser.id, passwordForm.newPassword);
      toast.success(`Senha do usuário "${selectedUser.name}" atualizada com sucesso! As alterações foram salvas permanentemente.`);
      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
      setPasswordForm({ newPassword: '' });
    } catch (error) {
      console.error('Erro detalhado ao atualizar senha:', error);
      toast.error(`Erro ao atualizar senha: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.name}"? Esta ação será permanente e não pode ser desfeita.`)) {
      return;
    }

    setLoading(true);

    try {
      await removeUser(user.id);
      toast.success(`Usuário "${user.name}" excluído com sucesso! As alterações foram salvas permanentemente.`);
    } catch (error) {
      console.error('Erro detalhado ao excluir usuário:', error);
      toast.error(`Erro ao excluir usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      type: user.type,
      maxPlates: user.maxPlates || 10,
    });
    setIsEditDialogOpen(true);
  };

  const openPasswordDialog = (user: any) => {
    setSelectedUser(user);
    setPasswordForm({ newPassword: '' });
    setIsPasswordDialogOpen(true);
  };

  const getUserTypeBadge = (type: string) => {
    const variants = {
      admin: 'destructive',
      transportadora: 'default',
      portaria: 'secondary',
    } as const;

    const labels = {
      admin: 'Administrador',
      transportadora: 'Transportadora',
      portaria: 'Portaria',
    };

    return (
      <Badge variant={variants[type as keyof typeof variants]}>
        {labels[type as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie todos os usuários do sistema
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Total de {allUsers.length} usuários cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Limite de Placas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{getUserTypeBadge(user.type)}</TableCell>
                  <TableCell>
                    {user.type === 'transportadora' ? user.maxPlates || '-' : '-'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPasswordDialog(user)}
                    >
                      Senha
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Usuário</Label>
              <Select
                value={createForm.type}
                onValueChange={(value: 'admin' | 'transportadora' | 'portaria') =>
                  setCreateForm({ ...createForm, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="transportadora">Transportadora</SelectItem>
                  <SelectItem value="portaria">Portaria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createForm.type === 'transportadora' && (
              <div className="space-y-2">
                <Label htmlFor="maxPlates">Limite de Placas</Label>
                <Input
                  id="maxPlates"
                  type="number"
                  min="1"
                  value={createForm.maxPlates}
                  onChange={(e) => setCreateForm({ ...createForm, maxPlates: parseInt(e.target.value) })}
                  required
                />
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere os dados do usuário {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Tipo de Usuário</Label>
              <Select
                value={editForm.type}
                onValueChange={(value: 'admin' | 'transportadora' | 'portaria') =>
                  setEditForm({ ...editForm, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="transportadora">Transportadora</SelectItem>
                  <SelectItem value="portaria">Portaria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.type === 'transportadora' && (
              <div className="space-y-2">
                <Label htmlFor="edit-maxPlates">Limite de Placas</Label>
                <Input
                  id="edit-maxPlates"
                  type="number"
                  min="1"
                  value={editForm.maxPlates}
                  onChange={(e) => setEditForm({ ...editForm, maxPlates: parseInt(e.target.value) })}
                  required
                />
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ newPassword: e.target.value })}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Atualizando...' : 'Atualizar Senha'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;