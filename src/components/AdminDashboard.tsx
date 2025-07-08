
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, 
  LogOut, 
  FileText, 
  Settings, 
  Users, 
  Truck, 
  Plus, 
  Trash2,
  Download,
  Clock,
  Calendar,
  UserCog
} from 'lucide-react';
import { toast } from 'sonner';
import UserManagement from '@/components/UserManagement';

const AdminDashboard = () => {
  const { 
    user, 
    logout, 
    getAllPlates, 
    removePlate, 
    systemConfig, 
    updateSystemConfig,
    transportadoras,
    addTransportadora,
    removeTransportadora,
    updateTransportadoraMaxPlates
  } = useAuth();

  const [newTransportadora, setNewTransportadora] = useState({
    username: '',
    password: '',
    name: ''
  });
  const [filterTransportadora, setFilterTransportadora] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(false);

  const allPlates = getAllPlates();

  // Filter plates based on selected filters
  const filteredPlates = allPlates.filter(plate => {
    if (filterTransportadora !== 'all' && plate.transportadoraId !== filterTransportadora) {
      return false;
    }
    if (filterDate && !plate.createdAt.toISOString().startsWith(filterDate)) {
      return false;
    }
    return true;
  });

  const handleAddTransportadora = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransportadora.username || !newTransportadora.password || !newTransportadora.name) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      await addTransportadora(
        newTransportadora.username,
        newTransportadora.password,
        newTransportadora.name
      );
      setNewTransportadora({ username: '', password: '', name: '' });
      toast.success('Transportadora adicionada com sucesso!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTransportadora = (id: string) => {
    removeTransportadora(id);
    toast.success('Transportadora removida com sucesso!');
  };

  const handleConfigUpdate = (field: string, value: any) => {
    updateSystemConfig({
      ...systemConfig,
      [field]: value
    });
    toast.success('Configuração atualizada!');
  };

  const exportToCSV = () => {
    const headers = ['Placa', 'Transportadora', 'Data/Hora'];
    const csvContent = [
      headers.join(','),
      ...filteredPlates.map(plate => [
        plate.number,
        plate.transportadoraName,
        plate.createdAt.toLocaleString('pt-BR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_placas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Relatório exportado com sucesso!');
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayIndex];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Painel Administrativo
              </h1>
              <p className="text-gray-600">
                Gerencie o sistema de placas
              </p>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Placas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {allPlates.length}/{systemConfig.maxTotalPlates}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transportadoras</p>
                  <p className="text-2xl font-bold text-gray-900">{transportadoras.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Horário</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {systemConfig.allowedHours.start}-{systemConfig.allowedHours.end}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dias Ativos</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {systemConfig.allowedDays.length} dias
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="transportadoras" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Transportadoras
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Relatório de Placas</CardTitle>
                    <CardDescription>
                      Visualize e exporte dados de todas as placas cadastradas
                    </CardDescription>
                  </div>
                  <Button
                    onClick={exportToCSV}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label>Filtrar por Transportadora</Label>
                    <Select value={filterTransportadora} onValueChange={setFilterTransportadora}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {transportadoras.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Filtrar por Data</Label>
                    <Input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Plates Table */}
                <div className="space-y-4">
                  {filteredPlates.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma placa encontrada</p>
                    </div>
                  ) : (
                    filteredPlates.map((plate, index) => (
                      <div
                        key={plate.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="font-mono text-lg font-bold text-gray-900">
                            {plate.number}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{plate.transportadoraName}</p>
                            <p className="text-sm text-gray-600">
                              {plate.createdAt.toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => removePlate(plate.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          {/* Transportadoras Tab */}
          <TabsContent value="transportadoras">
            <div className="space-y-6">
              {/* Add New Transportadora */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Adicionar Transportadora
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddTransportadora} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Usuário</Label>
                      <Input
                        value={newTransportadora.username}
                        onChange={(e) => setNewTransportadora(prev => ({
                          ...prev,
                          username: e.target.value
                        }))}
                        placeholder="usuario"
                      />
                    </div>
                    <div>
                      <Label>Senha</Label>
                      <Input
                        type="password"
                        value={newTransportadora.password}
                        onChange={(e) => setNewTransportadora(prev => ({
                          ...prev,
                          password: e.target.value
                        }))}
                        placeholder="senha123"
                      />
                    </div>
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={newTransportadora.name}
                        onChange={(e) => setNewTransportadora(prev => ({
                          ...prev,
                          name: e.target.value
                        }))}
                        placeholder="Nome da Empresa"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Adicionando...' : 'Adicionar'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Transportadoras List */}
              <Card>
                <CardHeader>
                  <CardTitle>Transportadoras Cadastradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transportadoras.map((transportadora, index) => (
                      <div
                        key={transportadora.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-transport-100 rounded-lg">
                            <Truck className="w-5 h-5 text-transport-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transportadora.name}</p>
                            <p className="text-sm text-gray-600">@{transportadora.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Label className="text-xs">Limite de Placas</Label>
                            <Input
                              type="number"
                              value={transportadora.maxPlates || 0}
                              onChange={(e) => updateTransportadoraMaxPlates(
                                transportadora.id,
                                parseInt(e.target.value) || 0
                              )}
                              className="w-20 text-center"
                              min="0"
                              max="50"
                            />
                          </div>
                          <Button
                            onClick={() => handleRemoveTransportadora(transportadora.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Gerais</CardTitle>
                  <CardDescription>
                    Configure limites e restrições do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Máximo de Placas no Sistema</Label>
                    <Input
                      type="number"
                      value={systemConfig.maxTotalPlates}
                      onChange={(e) => handleConfigUpdate('maxTotalPlates', parseInt(e.target.value) || 0)}
                      min="1"
                      max="1000"
                    />
                  </div>
                  <div>
                    <Label>Máximo de Placas por Transportadora</Label>
                    <Input
                      type="number"
                      value={systemConfig.maxPlatesPerTransportadora}
                      onChange={(e) => handleConfigUpdate('maxPlatesPerTransportadora', parseInt(e.target.value) || 0)}
                      min="1"
                      max="100"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Time Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Horário</CardTitle>
                  <CardDescription>
                    Configure quando o cadastro de placas é permitido
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Horário Inicial</Label>
                      <Input
                        type="time"
                        value={systemConfig.allowedHours.start}
                        onChange={(e) => handleConfigUpdate('allowedHours', {
                          ...systemConfig.allowedHours,
                          start: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label>Horário Final</Label>
                      <Input
                        type="time"
                        value={systemConfig.allowedHours.end}
                        onChange={(e) => handleConfigUpdate('allowedHours', {
                          ...systemConfig.allowedHours,
                          end: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-base font-medium">Dias Permitidos</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day}`}
                            checked={systemConfig.allowedDays.includes(day)}
                            onCheckedChange={(checked) => {
                              const newDays = checked
                                ? [...systemConfig.allowedDays, day]
                                : systemConfig.allowedDays.filter(d => d !== day);
                              handleConfigUpdate('allowedDays', newDays.sort());
                            }}
                          />
                          <Label htmlFor={`day-${day}`}>{getDayName(day)}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
