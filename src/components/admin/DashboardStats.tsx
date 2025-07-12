import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Users, Clock, Calendar } from 'lucide-react';
import { SystemConfig, Plate, User, useAuth } from '@/contexts/SupabaseAuthContext';

interface DashboardStatsProps {
  allPlates: Plate[];
  systemConfig: SystemConfig;
  transportadoras: User[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  allPlates,
  systemConfig,
  transportadoras
}) => {
  // Calcular total dinamicamente baseado nas transportadoras
  const totalAvailableTrips = transportadoras.reduce((total, transportadora) => {
    return total + (transportadora.maxPlates || systemConfig.maxPlatesPerTransportadora);
  }, 0);
  
  console.log('📊 DashboardStats - Transportadoras:', transportadoras.map(t => ({ 
    name: t.name, 
    maxPlates: t.maxPlates 
  })));
  console.log('📊 DashboardStats - Total calculado:', totalAvailableTrips);

  return (
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
                {allPlates.length}/{totalAvailableTrips}
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
  );
};

export default DashboardStats;