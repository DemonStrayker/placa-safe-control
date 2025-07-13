import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, LogOut, CheckCircle, XCircle, Clock, ArrowUp, ArrowDown, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import PDFReport from '@/components/PDFReport';
import { SupabaseStatus } from '@/components/SupabaseStatus';

const PortariaDashboard = () => {
  const { user, logout, getAllPlates, confirmArrival, confirmDeparture } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'arrived' | 'departed'>('all');
  
  const allPlates = getAllPlates();

  const filteredPlates = allPlates.filter(plate => {
    const matchesSearch = plate.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plate.transportadoraName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'pending') return matchesSearch && !plate.arrivalConfirmed;
    if (statusFilter === 'arrived') return matchesSearch && plate.arrivalConfirmed && !plate.departureConfirmed;
    if (statusFilter === 'departed') return matchesSearch && plate.departureConfirmed;
    
    return matchesSearch;
  });

  const handleConfirmArrival = async (plateId: string) => {
    try {
      await confirmArrival(plateId);
      toast.success('Chegada confirmada com sucesso!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleConfirmDeparture = async (plateId: string) => {
    try {
      await confirmDeparture(plateId);
      toast.success('Saída confirmada com sucesso!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (plate: any) => {
    if (plate.departureConfirmed) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Saiu</Badge>;
    }
    if (plate.arrivalConfirmed) {
      return <Badge variant="default" className="bg-green-100 text-green-700">Presente</Badge>;
    }
    return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Pendente</Badge>;
  };

  const formatPlate = (plate: string) => {
    if (plate.length === 7 && !plate.includes('-')) {
      return `${plate.slice(0, 3)}-${plate.slice(3)}`;
    }
    return plate;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-600 rounded-lg text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Portaria - {user?.name}
              </h1>
              <p className="text-gray-600">
                Controle de entrada e saída de veículos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SupabaseStatus />
            <Button
              onClick={logout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Placas</p>
                  <p className="text-2xl font-bold text-gray-900">{allPlates.length}</p>
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
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {allPlates.filter(p => !p.arrivalConfirmed).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Presentes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {allPlates.filter(p => p.arrivalConfirmed && !p.departureConfirmed).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saíram</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {allPlates.filter(p => p.departureConfirmed).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search">Buscar por placa ou transportadora</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Digite para buscar..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  size="sm"
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                  size="sm"
                >
                  Pendentes
                </Button>
                <Button
                  variant={statusFilter === 'arrived' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('arrived')}
                  size="sm"
                >
                  Presentes
                </Button>
                <Button
                  variant={statusFilter === 'departed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('departed')}
                  size="sm"
                >
                  Saíram
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PDF Report */}
        <PDFReport />

        {/* Plates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Controle de Placas</CardTitle>
            <CardDescription>
              Gerencie a entrada e saída de veículos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPlates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma placa encontrada</p>
                <p className="text-sm">Ajuste os filtros para ver mais resultados</p>
              </div>
            ) : (
              <>
                {/* Desktop Table - Hidden on mobile */}
                <div className="hidden lg:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Transportadora</TableHead>
                        <TableHead>Data Cadastro</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Chegada</TableHead>
                        <TableHead>Saída</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlates.map((plate) => (
                        <TableRow key={plate.id}>
                          <TableCell className="font-mono font-bold">
                            {formatPlate(plate.number)}
                          </TableCell>
                          <TableCell>{plate.transportadoraName}</TableCell>
                          <TableCell>
                            {plate.createdAt.toLocaleDateString('pt-BR')} às{' '}
                            {plate.createdAt.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>{getStatusBadge(plate)}</TableCell>
                          <TableCell>
                            {plate.arrivalConfirmed ? (
                              <div className="text-sm">
                                <div className="font-medium text-green-600">Confirmada</div>
                                <div className="text-gray-500">
                                  {plate.arrivalConfirmed.toLocaleDateString('pt-BR')} às{' '}
                                  {plate.arrivalConfirmed.toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Pendente</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {plate.departureConfirmed ? (
                              <div className="text-sm">
                                <div className="font-medium text-gray-600">Confirmada</div>
                                <div className="text-gray-500">
                                  {plate.departureConfirmed.toLocaleDateString('pt-BR')} às{' '}
                                  {plate.departureConfirmed.toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Pendente</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {!plate.arrivalConfirmed && (
                                <Button
                                  onClick={() => handleConfirmArrival(plate.id)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <ArrowDown className="w-4 h-4 mr-1" />
                                  Chegada
                                </Button>
                              )}
                              {plate.arrivalConfirmed && !plate.departureConfirmed && (
                                <Button
                                  onClick={() => handleConfirmDeparture(plate.id)}
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-600 text-gray-600 hover:bg-gray-50"
                                >
                                  <ArrowUp className="w-4 h-4 mr-1" />
                                  Saída
                                </Button>
                              )}
                              {plate.departureConfirmed && (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                  Finalizada
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards - Shown on mobile and tablet */}
                <div className="lg:hidden space-y-4">
                  {filteredPlates.map((plate, index) => (
                    <Card
                      key={plate.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header with plate number and status */}
                          <div className="flex items-center justify-between">
                            <div className="font-mono text-lg font-bold text-gray-900">
                              {formatPlate(plate.number)}
                            </div>
                            {getStatusBadge(plate)}
                          </div>

                          {/* Transportadora */}
                          <div>
                            <p className="text-sm text-gray-600">Transportadora</p>
                            <p className="font-medium text-gray-900">{plate.transportadoraName}</p>
                          </div>

                          {/* Registration date */}
                          <div>
                            <p className="text-sm text-gray-600">Data de Cadastro</p>
                            <p className="text-sm text-gray-900">
                              {plate.createdAt.toLocaleDateString('pt-BR')} às{' '}
                              {plate.createdAt.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>

                          {/* Arrival status */}
                          <div>
                            <p className="text-sm text-gray-600">Chegada</p>
                            {plate.arrivalConfirmed ? (
                              <div className="text-sm">
                                <div className="font-medium text-green-600">Confirmada</div>
                                <div className="text-gray-500">
                                  {plate.arrivalConfirmed.toLocaleDateString('pt-BR')} às{' '}
                                  {plate.arrivalConfirmed.toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Pendente</span>
                            )}
                          </div>

                          {/* Departure status */}
                          <div>
                            <p className="text-sm text-gray-600">Saída</p>
                            {plate.departureConfirmed ? (
                              <div className="text-sm">
                                <div className="font-medium text-gray-600">Confirmada</div>
                                <div className="text-gray-500">
                                  {plate.departureConfirmed.toLocaleDateString('pt-BR')} às{' '}
                                  {plate.departureConfirmed.toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Pendente</span>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex gap-2 flex-wrap">
                              {!plate.arrivalConfirmed && (
                                <Button
                                  onClick={() => handleConfirmArrival(plate.id)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white flex-1 min-w-0"
                                >
                                  <ArrowDown className="w-4 h-4 mr-1" />
                                  Confirmar Chegada
                                </Button>
                              )}
                              {plate.arrivalConfirmed && !plate.departureConfirmed && (
                                <Button
                                  onClick={() => handleConfirmDeparture(plate.id)}
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-600 text-gray-600 hover:bg-gray-50 flex-1 min-w-0"
                                >
                                  <ArrowUp className="w-4 h-4 mr-1" />
                                  Confirmar Saída
                                </Button>
                              )}
                              {plate.departureConfirmed && (
                                <div className="flex-1 flex justify-center">
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                    Processo Finalizado
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortariaDashboard;