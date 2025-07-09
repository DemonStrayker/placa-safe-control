import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SystemConfig, useAuth } from '@/contexts/AuthContext';
import SchedulingManagement from '@/components/SchedulingManagement';
import { Settings, CalendarCheck, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsTabProps {
  systemConfig: SystemConfig;
  updateSystemConfig: (config: SystemConfig) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  systemConfig,
  updateSystemConfig
}) => {
  const { getTotalAvailableTrips, transportadoras } = useAuth();
  
  const handleConfigUpdate = (field: string, value: any) => {
    updateSystemConfig({
      ...systemConfig,
      [field]: value
    });
    toast.success('Configuração atualizada!');
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayIndex];
  };

  const totalDynamicTrips = getTotalAvailableTrips();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" />
            Agendamentos
          </TabsTrigger>
          <TabsTrigger value="trips" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Viagens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6">
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
                  <Label>Máximo de Placas por Transportadora (Padrão)</Label>
                  <Input
                    type="number"
                    value={systemConfig.maxPlatesPerTransportadora}
                    onChange={(e) => handleConfigUpdate('maxPlatesPerTransportadora', parseInt(e.target.value) || 0)}
                    min="1"
                    max="100"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Valor padrão para novas transportadoras
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Total Dinâmico de Viagens</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{totalDynamicTrips}</p>
                  <p className="text-sm text-blue-700">
                    Calculado automaticamente com base nos limites individuais das transportadoras
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Time Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Configurações de Horário
                </CardTitle>
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

        <TabsContent value="scheduling" className="space-y-6">
          <SchedulingManagement />
        </TabsContent>

        <TabsContent value="trips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Gestão de Viagens por Transportadora
              </CardTitle>
              <CardDescription>
                Configure os limites individuais de cada transportadora. O total do sistema é calculado automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Total de Viagens Disponíveis</h3>
                      <p className="text-sm text-gray-600">Soma automática dos limites individuais</p>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {totalDynamicTrips}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Limites por Transportadora</h4>
                  {transportadoras.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Nenhuma transportadora cadastrada
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {transportadoras.map((transportadora) => (
                        <div
                          key={transportadora.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{transportadora.name}</p>
                            <p className="text-sm text-gray-600">@{transportadora.username}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Limite:</span>
                            <Badge variant="outline">
                              {transportadora.maxPlates || systemConfig.maxPlatesPerTransportadora} viagens
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <strong>Como funciona:</strong> O total de viagens disponíveis no sistema é calculado automaticamente 
                    como a soma dos limites individuais de cada transportadora. Para aumentar ou diminuir o total, 
                    ajuste os limites individuais na seção "Usuários".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsTab;