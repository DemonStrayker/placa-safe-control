import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SchedulingPickerProps {
  selectedDateTime: Date | null;
  onDateTimeChange: (dateTime: Date | null) => void;
}

const SchedulingPicker: React.FC<SchedulingPickerProps> = ({
  selectedDateTime,
  onDateTimeChange
}) => {
  const { getAvailableSchedulingDates, systemConfig, schedulingWindows } = useAuth();
  const [availableDates, setAvailableDates] = useState<{ date: Date, timeSlots: string[] }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  useEffect(() => {
    const dates = getAvailableSchedulingDates();
    setAvailableDates(dates);
  }, [systemConfig, schedulingWindows]);

  useEffect(() => {
    if (selectedDateTime) {
      const dateStr = selectedDateTime.toISOString().split('T')[0];
      const timeStr = selectedDateTime.toTimeString().slice(0, 5);
      setSelectedDate(dateStr);
      setSelectedTime(timeStr);
    }
  }, [selectedDateTime]);

  const handleDateChange = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime('');
    onDateTimeChange(null);
  };

  const handleTimeChange = (timeStr: string) => {
    setSelectedTime(timeStr);
    if (selectedDate && timeStr) {
      const dateTime = new Date(selectedDate);
      const [hours, minutes] = timeStr.split(':').map(Number);
      dateTime.setHours(hours, minutes, 0, 0);
      onDateTimeChange(dateTime);
    }
  };

  const clearSelection = () => {
    setSelectedDate('');
    setSelectedTime('');
    onDateTimeChange(null);
  };

  const selectedDateData = availableDates.find(d => 
    d.date.toISOString().split('T')[0] === selectedDate
  );

  const getDayName = (dayIndex: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayIndex];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Agendamento de Carregamento
        </CardTitle>
        <CardDescription>
          Selecione uma data e horário para o carregamento (opcional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableDates.length === 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Agendamento não configurado
                </p>
                <p className="text-xs text-amber-700">
                  O administrador ainda não configurou janelas de agendamento. A placa será registrada para carregamento imediato.
                </p>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Nota:</strong> Sem agendamento configurado, todas as placas são registradas para carregamento imediato.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="date-select">Data de Carregamento</Label>
              <Select value={selectedDate} onValueChange={handleDateChange}>
                <SelectTrigger id="date-select">
                  <SelectValue placeholder="Selecione uma data" />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((dateData) => {
                    const dateStr = dateData.date.toISOString().split('T')[0];
                    const dayName = getDayName(dateData.date.getDay());
                    const formattedDate = dateData.date.toLocaleDateString('pt-BR');
                    
                    return (
                      <SelectItem key={dateStr} value={dateStr}>
                        {dayName}, {formattedDate}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedDate && selectedDateData && (
              <div>
                <Label htmlFor="time-select">Horário de Carregamento</Label>
                <Select value={selectedTime} onValueChange={handleTimeChange}>
                  <SelectTrigger id="time-select">
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedDateData.timeSlots.map((timeSlot) => (
                      <SelectItem key={timeSlot} value={timeSlot}>
                        {timeSlot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedDateTime && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Agendado para: {selectedDateTime.toLocaleDateString('pt-BR')} às {selectedDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Limpar
                </Button>
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Dica:</strong> O agendamento é opcional. Se não selecionar, a placa será registrada para carregamento imediato.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SchedulingPicker;