import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type SystemConfigRow = Tables<'system_config'>;

export interface SystemConfig {
  id: string;
  max_total_plates: number;
  max_plates_per_transportadora: number;
  allowed_hours_start: string;
  allowed_hours_end: string;
  allowed_days: number[];
  created_at: string;
  updated_at: string;
}

export const useSystemConfig = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar configuração do Supabase
  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }
      
      if (data) {
        setConfig(data);
      } else {
        // Criar configuração padrão se não existir
        await createDefaultConfig();
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast.error('Erro ao carregar configuração do sistema');
    } finally {
      setLoading(false);
    }
  };

  // Criar configuração padrão
  const createDefaultConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .insert({
          max_total_plates: 50,
          max_plates_per_transportadora: 10,
          allowed_hours_start: '08:00:00',
          allowed_hours_end: '18:00:00',
          allowed_days: [1, 2, 3, 4, 5], // Monday to Friday
        })
        .select()
        .single();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Erro ao criar configuração padrão:', error);
      throw error;
    }
  };

  // Atualizar configuração
  const updateConfig = async (updates: Partial<SystemConfig>) => {
    if (!config) return;

    try {
      const { data, error } = await supabase
        .from('system_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id)
        .select()
        .single();

      if (error) throw error;
      
      setConfig(data);
      toast.success('Configuração atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao atualizar configuração');
      throw error;
    }
  };

  // Configurar real-time subscriptions
  useEffect(() => {
    loadConfig();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('system-config-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_config'
        },
        (payload) => {
          console.log('Configuração atualizada:', payload);
          setConfig(payload.new as SystemConfig);
          toast.success('Configuração do sistema atualizada');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    config,
    loading,
    updateConfig,
    loadConfig
  };
};