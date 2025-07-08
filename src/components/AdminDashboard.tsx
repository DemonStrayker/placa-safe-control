import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, LogOut, FileText, Settings, UserCog } from 'lucide-react';
import UserManagement from '@/components/UserManagement';
import DashboardStats from '@/components/admin/DashboardStats';
import ReportsTab from '@/components/admin/ReportsTab';
import SettingsTab from '@/components/admin/SettingsTab';

const AdminDashboard = () => {
  const { 
    user, 
    logout, 
    getAllPlates, 
    removePlate, 
    systemConfig, 
    updateSystemConfig,
    transportadoras
  } = useAuth();

  const allPlates = getAllPlates();

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
        <DashboardStats 
          allPlates={allPlates}
          systemConfig={systemConfig}
          transportadoras={transportadoras}
        />

        {/* Main Content */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ReportsTab 
              allPlates={allPlates}
              transportadoras={transportadoras}
              removePlate={removePlate}
            />
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SettingsTab 
              systemConfig={systemConfig}
              updateSystemConfig={updateSystemConfig}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;