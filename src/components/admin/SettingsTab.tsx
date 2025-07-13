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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="general" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
            <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Geral</span>
            <span className="sm:hidden">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
            <CalendarCheck className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Agendamentos</span>
            <span className="sm:hidden">Agenda</span>
          </TabsTrigger>
          <TabsTrigger value="trips" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Viagens</span>
            <span className="sm:hidden">Viagens</span>
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
            <TestTube className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Testes</span>
            <span className="sm:hidden">Testes</span>
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
              
               <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                 <div className="flex items-center gap-2 mb-2">
                   <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                   <span className="font-medium text-sm sm:text-base text-blue-900">Total Dinâmico de Viagens</span>
                 </div>
                 <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalDynamicTrips}</p>
                 <p className="text-xs sm:text-sm text-blue-700">
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
                 <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                     <div className="min-w-0 flex-1">
                       <h3 className="font-medium text-gray-900">Total de Viagens Disponíveis</h3>
                       <p className="text-xs sm:text-sm text-gray-600">Soma automática dos limites individuais</p>
                     </div>
                     <Badge variant="secondary" className="text-base sm:text-lg px-3 sm:px-4 py-1 sm:py-2 flex-shrink-0">
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
                           className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 border rounded-lg"
                         >
                           <div className="min-w-0 flex-1">
                             <p className="font-medium text-gray-900 truncate">{transportadora.name}</p>
                             <p className="text-sm text-gray-600 truncate">@{transportadora.username}</p>
                           </div>
                           <div className="flex items-center gap-2 flex-shrink-0">
                             <span className="text-xs sm:text-sm text-gray-600">Limite:</span>
                             <Badge variant="outline" className="text-xs">
                               {transportadora.maxPlates || systemConfig.maxPlatesPerTransportadora} viagens
                             </Badge>
                           </div>
                         </div>
                       ))}
                    </div>
                  )}
                </div>

                 <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                   <p className="text-xs sm:text-sm text-blue-700">
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