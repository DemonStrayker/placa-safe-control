import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type PlateRow = Tables<'plates'>;

export interface Plate {
  id: string;
  number: string;
  transportadora_id: string;
  transportadora_name: string;
  created_at: string;
  scheduled_date: string | null;
  arrival_confirmed: string | null;
  departure_confirmed: string | null;
  observations: string | null;
}

export const usePlates = () => {
  const [plates, setPlates] = useState<Plate[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar placas do Supabase
  const loadPlates = async () => {
    try {
      const { data, error } = await supabase
        .from('plates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlates(data || []);
    } catch (error) {
      console.error('Erro ao carregar placas:', error);
      toast.error('Erro ao carregar placas do banco de dados');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar placa
  const addPlate = async (
    number: string,
    transportadora_id: string,
    transportadora_name: string,
    scheduled_date?: string,
    observations?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('plates')
        .insert({
          number: number.toUpperCase(),
          transportadora_id,
          transportadora_name,
          scheduled_date,
          observations,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Placa adicionada com sucesso!');
      return data;
    } catch (error: any) {
      console.error('Erro ao adicionar placa:', error);
      if (error.code === '23505') {
        throw new Error('Esta placa já está cadastrada');
      }
      throw new Error('Erro ao adicionar placa');
    }
  };

  // Remover placa
  const removePlate = async (plateId: string) => {
    try {
      const { error } = await supabase
        .from('plates')
        .delete()
        .eq('id', plateId);

      if (error) throw error;
      
      toast.success('Placa removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover placa:', error);
      toast.error('Erro ao remover placa');
      throw error;
    }
  };

  // Confirmar chegada
  const confirmArrival = async (plateId: string) => {
    try {
      const { error } = await supabase
        .from('plates')
        .update({ arrival_confirmed: new Date().toISOString() })
        .eq('id', plateId);

      if (error) throw error;
      
      toast.success('Chegada confirmada com sucesso!');
    } catch (error) {
      console.error('Erro ao confirmar chegada:', error);
      toast.error('Erro ao confirmar chegada');
      throw error;
    }
  };

  // Confirmar saída
  const confirmDeparture = async (plateId: string) => {
    try {
      // Verificar se a chegada foi confirmada
      const { data: plate } = await supabase
        .from('plates')
        .select('arrival_confirmed')
        .eq('id', plateId)
        .single();

      if (!plate?.arrival_confirmed) {
        throw new Error('Confirmação de chegada é necessária antes da saída');
      }

      const { error } = await supabase
        .from('plates')
        .update({ departure_confirmed: new Date().toISOString() })
        .eq('id', plateId);

      if (error) throw error;
      
      toast.success('Saída confirmada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao confirmar saída:', error);
      toast.error(error.message || 'Erro ao confirmar saída');
      throw error;
    }
  };

  // Configurar real-time subscriptions
  useEffect(() => {
    loadPlates();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('plates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plates'
        },
        (payload) => {
          console.log('Mudança detectada:', payload);
          
          if (payload.eventType === 'INSERT') {
            setPlates(prev => [payload.new as Plate, ...prev]);
            toast.success(`Nova placa ${(payload.new as Plate).number} adicionada`);
          } else if (payload.eventType === 'UPDATE') {
            setPlates(prev => prev.map(plate => 
              plate.id === payload.new.id ? payload.new as Plate : plate
            ));
            const updatedPlate = payload.new as Plate;
            if (updatedPlate.departure_confirmed) {
              toast.success(`Saída confirmada para placa ${updatedPlate.number}`);
            } else if (updatedPlate.arrival_confirmed) {
              toast.success(`Chegada confirmada para placa ${updatedPlate.number}`);
            }
          } else if (payload.eventType === 'DELETE') {
            setPlates(prev => prev.filter(plate => plate.id !== payload.old.id));
            toast.success('Placa removida');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    plates,
    loading,
    addPlate,
    removePlate,
    confirmArrival,
    confirmDeparture,
    loadPlates
  };
};