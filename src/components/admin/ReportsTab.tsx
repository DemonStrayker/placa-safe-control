import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Plate, User } from '@/contexts/AuthContext';

interface ReportsTabProps {
  allPlates: Plate[];
  transportadoras: User[];
  removePlate: (plateId: string) => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({
  allPlates,
  transportadoras,
  removePlate
}) => {
  const [filterTransportadora, setFilterTransportadora] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Filter plates based on selected filters
  const filteredPlates = allPlates.filter(plate => {
    if (filterTransportadora !== 'all' && plate.transportadoraId !== filterTransportadora) {
      return false;
    }
    if (filterDate && !plate.createdAt.toISOString().startsWith(filterDate)) {
      return false;
    }
    return true;
  });

  const exportToCSV = () => {
    const headers = ['Placa', 'Transportadora', 'Data/Hora'];
    const csvContent = [
      headers.join(','),
      ...filteredPlates.map(plate => [
        plate.number,
        plate.transportadoraName,
        plate.createdAt.toLocaleString('pt-BR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_placas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Relatório exportado com sucesso!');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Relatório de Placas</CardTitle>
            <CardDescription>
              Visualize e exporte dados de todas as placas cadastradas
            </CardDescription>
          </div>
          <Button
            onClick={exportToCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>Filtrar por Transportadora</Label>
            <Select value={filterTransportadora} onValueChange={setFilterTransportadora}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {transportadoras.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Filtrar por Data</Label>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>

        {/* Plates Table */}
        <div className="space-y-4">
          {filteredPlates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma placa encontrada</p>
            </div>
          ) : (
            filteredPlates.map((plate, index) => (
              <div
                key={plate.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="font-mono text-lg font-bold text-gray-900">
                    {plate.number}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{plate.transportadoraName}</p>
                    <p className="text-sm text-gray-600">
                      {plate.createdAt.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => removePlate(plate.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportsTab;