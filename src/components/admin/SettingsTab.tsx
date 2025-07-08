import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SystemConfig } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SettingsTabProps {
  systemConfig: SystemConfig;
  updateSystemConfig: (config: SystemConfig) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  systemConfig,
  updateSystemConfig
}) => {
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

  return (
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
  );
};

export default SettingsTab;