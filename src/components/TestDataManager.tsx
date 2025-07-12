import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TestTube, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const TestDataManager = () => {
  const { user, plates, addPlate } = useAuth();

  if (user?.type !== 'admin') return null;

  const addTestData = () => {
    toast.info('Funcionalidade de teste indisponível com Supabase. Use o sistema normal para adicionar placas.');
  };

  const clearTestData = () => {
    toast.info('Funcionalidade indisponível com Supabase.');
  };

  const clearAllData = () => {
    toast.info('Funcionalidade indisponível com Supabase. Use o dashboard administrativo para gerenciar dados.');
  };

  const testPlatesCount = 0; // Indisponível com Supabase

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Gerenciamento de Dados de Teste
        </CardTitle>
        <CardDescription>
          Adicione ou remova dados de teste para facilitar os testes do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <p className="font-medium text-blue-900">Placas totais: {plates.length}</p>
            <p className="text-sm text-blue-700">Placas de teste: {testPlatesCount}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={addTestData}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Teste
            </Button>
            {testPlatesCount > 0 && (
              <Button
                onClick={clearTestData}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remover Teste
              </Button>
            )}
            <Button
              onClick={clearAllData}
              size="sm"
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Tudo
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Dados de teste incluem:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>1 placa cadastrada hoje</li>
            <li>1 placa cadastrada ontem (com chegada confirmada)</li>
            <li>1 placa agendada para hoje</li>
            <li>1 placa agendada para amanhã</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestDataManager;