import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SystemConfig, useAuth } from '@/contexts/SupabaseAuthContext';
import SchedulingManagement from '@/components/SchedulingManagement';
import TestDataManager from '@/components/TestDataManager';
import { Settings, CalendarCheck, TrendingUp, TestTube } from 'lucide-react';
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

  const totalDynamicTrips = getTotalAvailableTrips();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" />
            Agendamentos
          </TabsTrigger>
          <TabsTrigger value="trips" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Viagens
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Testes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure limites padrão do sistema
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
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-6">
          <SchedulingManagement 
            systemConfig={systemConfig}
            updateSystemConfig={updateSystemConfig}
          />
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

        <TabsContent value="testing" className="space-y-6">
          <TestDataManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsTab;