
import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Truck, Plus, Trash2, LogOut, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import SchedulingPicker from '@/components/SchedulingPicker';
import { SupabaseStatus } from '@/components/SupabaseStatus';

const TransportadoraDashboard = () => {
  const { user, logout, addPlate, removePlate, getAllPlates, systemConfig, schedulingWindows, transportadoras } = useAuth();
  const [newPlate, setNewPlate] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);
  
  const userPlates = getAllPlates();
  const maxPlates = user?.maxPlates || systemConfig.maxPlatesPerTransportadora;
  
  // Calcular total dinamicamente
  const totalAvailableTrips = transportadoras.reduce((total, transportadora) => {
    return total + (transportadora.maxPlates || systemConfig.maxPlatesPerTransportadora);
  }, 0);

  const handleAddPlate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim()) return;

    setLoading(true);
    try {
      await addPlate(newPlate.trim(), scheduledDateTime || undefined, observations.trim() || undefined);
      setNewPlate('');
      setScheduledDateTime(null);
      setObservations('');
      toast.success('Placa adicionada com sucesso!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlate = (plateId: string) => {
    removePlate(plateId);
    toast.success('Placa removida com sucesso!');
  };

  const formatPlate = (plate: string) => {
    // Format plate for display
    if (plate.length === 7 && !plate.includes('-')) {
      return `${plate.slice(0, 3)}-${plate.slice(3)}`;
    }
    return plate;
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayIndex];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-transport-50 to-transport-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-transport-500 rounded-lg text-white">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Dashboard - {user?.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Gerencie suas placas de veículos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <SupabaseStatus />
            <Button
              onClick={logout}
              variant="outline"
              className="flex items-center gap-2 text-sm"
              size="sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        {/* System Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Placas Cadastradas</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {userPlates.length}/{maxPlates}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Horário Permitido</p>
                  <p className="text-sm sm:text-lg font-semibold text-gray-900">
                    {systemConfig.allowedHours.start} - {systemConfig.allowedHours.end}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Dias Permitidos</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">
                    {systemConfig.allowedDays.map(day => getDayName(day).slice(0, 3)).join(', ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Plate */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Nova Placa
            </CardTitle>
            <CardDescription>
              Adicione uma nova placa ao seu cadastro. Formato: ABC-1234 ou ABC1D23
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPlate} className="space-y-6">
              <div>
                <Label htmlFor="plate">Número da Placa</Label>
                <Input
                  id="plate"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC-1234 ou ABC1D23"
                  required
                />
              </div>

              <SchedulingPicker
                selectedDateTime={scheduledDateTime}
                onDateTimeChange={setScheduledDateTime}
              />
              
              <div>
                <Label htmlFor="observations">Observações (Opcional)</Label>
                <Input
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Digite observações sobre a carga..."
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading || userPlates.length >= maxPlates}
                  className="bg-transport-500 hover:bg-transport-600 w-full sm:w-auto"
                >
                  {loading ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </form>
            {userPlates.length >= maxPlates && (
              <p className="text-amber-600 text-sm mt-2">
                Limite de placas atingido ({maxPlates} placas)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Plates List */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Minhas Placas</CardTitle>
            <CardDescription>
              Lista de todas as suas placas cadastradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userPlates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma placa cadastrada ainda</p>
                <p className="text-sm">Adicione sua primeira placa acima</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userPlates.map((plate, index) => (
                  <div
                    key={plate.id}
                    className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-base sm:text-lg font-bold text-gray-900 break-all">
                          {formatPlate(plate.number)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Cadastrado: {plate.createdAt.toLocaleString('pt-BR', { 
                            dateStyle: 'short', 
                            timeStyle: 'short' 
                          })}
                        </p>
                        {plate.scheduledDate && (
                          <p className="text-xs sm:text-sm text-blue-600 font-medium">
                            Agendado: {plate.scheduledDate.toLocaleString('pt-BR', { 
                              dateStyle: 'short', 
                              timeStyle: 'short' 
                            })}
                          </p>
                        )}
                        {plate.observations && (
                          <p className="text-xs text-gray-500 mt-1 break-words">
                            {plate.observations}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleRemovePlate(plate.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransportadoraDashboard;
