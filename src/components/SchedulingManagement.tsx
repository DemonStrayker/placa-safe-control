import React, { useState } from 'react';
import { useAuth, SchedulingWindow } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, Pencil, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface SchedulingFormData {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const SchedulingManagement = () => {
  const { 
    schedulingWindows, 
    addSchedulingWindow, 
    updateSchedulingWindow, 
    removeSchedulingWindow 
  } = useAuth();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWindow, setEditingWindow] = useState<SchedulingWindow | null>(null);
  const [formData, setFormData] = useState<SchedulingFormData>({
    startDate: '',
    endDate: '',
    startTime: '08:00',
    endTime: '17:00',
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      startDate: '',
      endDate: '',
      startTime: '08:00',
      endTime: '17:00',
      isActive: true,
    });
    setEditingWindow(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (startDate > endDate) {
        toast.error('Data de início deve ser anterior à data de fim');
        return;
      }

      const windowData = {
        startDate,
        endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        isActive: formData.isActive,
      };

      if (editingWindow) {
        await updateSchedulingWindow(editingWindow.id, windowData);
        toast.success('Janela de agendamento atualizada com sucesso!');
      } else {
        await addSchedulingWindow(windowData);
        toast.success('Janela de agendamento criada com sucesso!');
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (window: SchedulingWindow) => {
    setEditingWindow(window);
    setFormData({
      startDate: window.startDate.toISOString().split('T')[0],
      endDate: window.endDate.toISOString().split('T')[0],
      startTime: window.startTime,
      endTime: window.endTime,
      isActive: window.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (windowId: string) => {
    if (confirm('Tem certeza que deseja excluir esta janela de agendamento?')) {
      try {
        await removeSchedulingWindow(windowId);
        toast.success('Janela de agendamento excluída com sucesso!');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleToggleActive = async (window: SchedulingWindow) => {
    try {
      await updateSchedulingWindow(window.id, { isActive: !window.isActive });
      toast.success(
        window.isActive 
          ? 'Janela de agendamento desativada' 
          : 'Janela de agendamento ativada'
      );
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Gerenciar Janelas de Agendamento
              </CardTitle>
              <CardDescription>
                Configure os períodos permitidos para agendamento de carregamento
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Janela
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingWindow ? 'Editar' : 'Nova'} Janela de Agendamento
                  </DialogTitle>
                  <DialogDescription>
                    Defina o período e horários permitidos para agendamento
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Data de Início</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Data de Fim</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Horário de Início</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">Horário de Fim</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Janela ativa</Label>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingWindow ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {schedulingWindows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma janela de agendamento configurada</p>
              <p className="text-sm">Crie uma nova janela para permitir agendamentos</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Horários</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedulingWindows.map((window) => (
                    <TableRow key={window.id}>
                      <TableCell>
                        <div className="font-medium">
                          {window.startDate.toLocaleDateString('pt-BR')} até{' '}
                          {window.endDate.toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {window.startTime} - {window.endTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={window.isActive}
                            onCheckedChange={() => handleToggleActive(window)}
                          />
                          <span className={window.isActive ? 'text-green-600' : 'text-gray-500'}>
                            {window.isActive ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(window)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(window.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulingManagement;