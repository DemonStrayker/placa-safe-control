import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, LogOut, FileText, Settings, UserCog } from 'lucide-react';
import { SupabaseStatus } from '@/components/SupabaseStatus';
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Painel Administrativo
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Gerencie o sistema de placas
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

        {/* Statistics */}
        <DashboardStats 
          allPlates={allPlates}
          systemConfig={systemConfig}
          transportadoras={transportadoras}
        />

        {/* Main Content */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="reports" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Relatórios</span>
              <span className="sm:hidden">Rel.</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
              <UserCog className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Usuários</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Configurações</span>
              <span className="sm:hidden">Config</span>
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