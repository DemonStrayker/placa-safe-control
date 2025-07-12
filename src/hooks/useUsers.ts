import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type UserRow = Tables<'users'>;

export interface User {
  id: string;
  username: string;
  name: string;
  type: string;
  max_plates: number | null;
  created_at: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar usuários do Supabase
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários do banco de dados');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar usuário
  const addUser = async (
    username: string,
    name: string,
    type: string,
    max_plates?: number
  ) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          username,
          name,
          type,
          max_plates,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Usuário adicionado com sucesso!');
      return data;
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      if (error.code === '23505') {
        throw new Error('Nome de usuário já existe');
      }
      throw new Error('Erro ao adicionar usuário');
    }
  };

  // Atualizar usuário
  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      
      toast.success('Usuário atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
      throw error;
    }
  };

  // Remover usuário
  const removeUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      toast.success('Usuário removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast.error('Erro ao remover usuário');
      throw error;
    }
  };

  // Configurar real-time subscriptions
  useEffect(() => {
    loadUsers();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('Mudança de usuário detectada:', payload);
          
          if (payload.eventType === 'INSERT') {
            setUsers(prev => [payload.new as User, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setUsers(prev => prev.map(user => 
              user.id === payload.new.id ? payload.new as User : user
            ));
          } else if (payload.eventType === 'DELETE') {
            setUsers(prev => prev.filter(user => user.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    users,
    loading,
    addUser,
    updateUser,
    removeUser,
    loadUsers
  };
};