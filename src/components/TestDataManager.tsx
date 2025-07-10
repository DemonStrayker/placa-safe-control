import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TestTube, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const TestDataManager = () => {
  const { user, plates, setPlates, saveToStorage } = useAuth();

  if (user?.type !== 'admin') return null;

  const addTestData = () => {
    const testPlates = [
      {
        id: `test-${Date.now()}-1`,
        number: 'ABC-1234',
        transportadoraId: '2',
        createdAt: new Date(),
        transportadoraName: 'Transportes ABC',
        observations: 'Placa de teste para hoje'
      },
      {
        id: `test-${Date.now()}-2`, 
        number: 'DEF-5678',
        transportadoraId: '3',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        transportadoraName: 'Logística XYZ',
        arrivalConfirmed: new Date(Date.now() - 12 * 60 * 60 * 1000),
        observations: 'Placa de teste de ontem'
      },
      {
        id: `test-${Date.now()}-3`,
        number: 'GHI-9012',
        transportadoraId: '2',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        scheduledDate: new Date(), // Scheduled for today
        transportadoraName: 'Transportes ABC',
        observations: 'Placa agendada para hoje'
      },
      {
        id: `test-${Date.now()}-4`,
        number: 'JKL-3456',
        transportadoraId: '3',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        transportadoraName: 'Logística XYZ',
        observations: 'Placa agendada para amanhã'
      }
    ];
    
    const updatedPlates = [...plates, ...testPlates];
    setPlates(updatedPlates);
    saveToStorage('plates', updatedPlates);
    toast.success(`${testPlates.length} placas de teste adicionadas!`);
  };

  const clearTestData = () => {
    const nonTestPlates = plates.filter(p => !p.id.startsWith('test-'));
    setPlates(nonTestPlates);
    saveToStorage('plates', nonTestPlates);
    toast.success('Dados de teste removidos!');
  };

  const clearAllData = () => {
    if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.')) {
      setPlates([]);
      saveToStorage('plates', []);
      toast.success('Todos os dados removidos!');
    }
  };

  const testPlatesCount = plates.filter(p => p.id.startsWith('test-')).length;

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