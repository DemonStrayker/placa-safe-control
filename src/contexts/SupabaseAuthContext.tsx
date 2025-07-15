import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePlates } from '@/hooks/usePlates';
import { useUsers } from '@/hooks/useUsers';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interfaces para compatibilidade com o código existente
export interface User {
  id: string;
  username: string;
  type: 'admin' | 'transportadora' | 'portaria';
  name: string;
  maxPlates?: number;
}

export interface Plate {
  id: string;
  number: string;
  transportadoraId: string;
  createdAt: Date;
  transportadoraName: string;
  arrivalConfirmed?: Date;
  departureConfirmed?: Date;
  scheduledDate?: Date;
  observations?: string;
}

export interface SystemConfig {
  maxTotalPlates: number;
  maxPlatesPerTransportadora: number;
  allowedHours: { start: string; end: string };
  allowedDays: number[];
}

export interface SchedulingWindow {
  id: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  plates: Plate[];
  addPlate: (plateNumber: string, scheduledDate?: Date, observations?: string) => Promise<boolean>;
  removePlate: (plateId: string) => void;
  getAllPlates: () => Plate[];
  confirmArrival: (plateId: string) => Promise<boolean>;
  confirmDeparture: (plateId: string) => Promise<boolean>;
  systemConfig: SystemConfig;
  updateSystemConfig: (config: SystemConfig) => void;
  transportadoras: User[];
  addTransportadora: (username: string, password: string, name: string) => Promise<boolean>;
  removeTransportadora: (id: string) => void;
  updateTransportadoraMaxPlates: (id: string, maxPlates: number) => void;
  allUsers: User[];
  addUser: (username: string, password: string, name: string, type: 'admin' | 'transportadora' | 'portaria', maxPlates?: number) => Promise<boolean>;
  updateUser: (id: string, updates: Partial<User>) => Promise<boolean>;
  removeUser: (id: string) => Promise<boolean>;
  schedulingWindows: SchedulingWindow[];
  addSchedulingWindow: (window: Omit<SchedulingWindow, 'id'>) => Promise<boolean>;
  updateSchedulingWindow: (id: string, updates: Partial<SchedulingWindow>) => Promise<boolean>;
  removeSchedulingWindow: (id: string) => Promise<boolean>;
  getTotalAvailableTrips: () => number;
  getPlatesByDate: (date: Date) => Plate[];
  getAvailableSchedulingDates: () => { date: Date, timeSlots: string[] }[];
  isDateWithinSchedulingWindows: (date: Date) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuários padrão para inicialização (apenas uma vez)
const initializeDefaultUsers = async () => {
  try {
    const { data: existingUsers } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    // Se já existem usuários, não fazer nada
    if (existingUsers && existingUsers.length > 0) {
      return;
    }

    // Criar usuários padrão
    const defaultUsers = [
      { username: 'admin', name: 'Administrador', type: 'admin', max_plates: null },
      { username: 'transportadora1', name: 'Transportes ABC', type: 'transportadora', max_plates: 5 },
      { username: 'transportadora2', name: 'Logística XYZ', type: 'transportadora', max_plates: 3 },
      { username: 'portaria', name: 'Portaria Principal', type: 'portaria', max_plates: null },
    ];

    for (const user of defaultUsers) {
      await supabase.from('users').insert(user);
    }

    console.log('✅ Usuários padrão criados no Supabase');
  } catch (error) {
    console.error('Erro ao criar usuários padrão:', error);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [schedulingWindows, setSchedulingWindows] = useState<SchedulingWindow[]>([]);
  
  // Hooks do Supabase
  const { plates: supabasePlates, addPlate: addPlateToSupabase, removePlate: removePlateFromSupabase, confirmArrival: confirmArrivalInSupabase, confirmDeparture: confirmDepartureInSupabase } = usePlates();
  const { users: supabaseUsers, addUser: addUserToSupabase, updateUser: updateUserInSupabase, removeUser: removeUserFromSupabase } = useUsers();
  const { config: supabaseConfig, updateConfig: updateConfigInSupabase } = useSystemConfig();

  // Converter dados do Supabase para formato legado
  const plates: Plate[] = supabasePlates.map(plate => ({
    id: plate.id,
    number: plate.number,
    transportadoraId: plate.transportadora_id,
    transportadoraName: plate.transportadora_name,
    createdAt: new Date(plate.created_at),
    arrivalConfirmed: plate.arrival_confirmed ? new Date(plate.arrival_confirmed) : undefined,
    departureConfirmed: plate.departure_confirmed ? new Date(plate.departure_confirmed) : undefined,
    scheduledDate: plate.scheduled_date ? new Date(plate.scheduled_date) : undefined,
    observations: plate.observations || undefined,
  }));

  const allUsers: User[] = supabaseUsers.map(user => ({
    id: user.id,
    username: user.username,
    name: user.name,
    type: user.type as 'admin' | 'transportadora' | 'portaria',
    maxPlates: user.max_plates || undefined,
  }));

  const systemConfig: SystemConfig = supabaseConfig ? {
    maxTotalPlates: supabaseConfig.max_total_plates,
    maxPlatesPerTransportadora: supabaseConfig.max_plates_per_transportadora,
    allowedHours: {
      start: supabaseConfig.allowed_hours_start.slice(0, 5), // Remove seconds
      end: supabaseConfig.allowed_hours_end.slice(0, 5),
    },
    allowedDays: supabaseConfig.allowed_days,
  } : {
    maxTotalPlates: 50,
    maxPlatesPerTransportadora: 10,
    allowedHours: { start: '08:00', end: '18:00' },
    allowedDays: [1, 2, 3, 4, 5],
  };

  const transportadoras = allUsers.filter(u => u.type === 'transportadora');

  useEffect(() => {
    // Inicializar usuários padrão na primeira execução
    initializeDefaultUsers();
    
    // Carregar usuário salvo
    const savedUser = localStorage.getItem('supabase_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Carregar janelas de agendamento do localStorage (mantido por compatibilidade)
    const savedWindows = localStorage.getItem('schedulingWindows');
    if (savedWindows) {
      const parsedWindows = JSON.parse(savedWindows);
      setSchedulingWindows(parsedWindows.map((w: any) => ({
        ...w,
        startDate: new Date(w.startDate),
        endDate: new Date(w.endDate)
      })));
    }
  }, []);

  // Validação de formato de placa
  const validatePlateFormat = (plateNumber: string): boolean => {
    // Formato antigo brasileiro: ABC-1234 (com hífen obrigatório)
    const oldFormat = /^[A-Z]{3}-\d{4}$/;
    // Formato Mercosul: ABC1D23 (sem hífen)
    const newFormat = /^[A-Z]{3}\d[A-Z]\d{2}$/;
    return oldFormat.test(plateNumber) || newFormat.test(plateNumber);
  };

  // Verificar horário permitido
  const isWithinAllowedTime = (): boolean => {
    if (user?.type === 'admin') return true;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const [startHour, startMinute] = systemConfig.allowedHours.start.split(':').map(Number);
    const [endHour, endMinute] = systemConfig.allowedHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    const currentDay = now.getDay();
    
    return systemConfig.allowedDays.includes(currentDay) && 
           currentTime >= startTime && 
           currentTime <= endTime;
  };

  // Login simples (sem senhas por enquanto)
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const foundUser = allUsers.find(u => u.username === username);
      if (!foundUser) {
        throw new Error('Usuário não encontrado');
      }

      // Simular validação de senha (sempre aceita por agora)
      setUser(foundUser);
      localStorage.setItem('supabase_user', JSON.stringify(foundUser));
      toast.success(`Bem-vindo, ${foundUser.name}!`);
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('supabase_user');
    toast.success('Logout realizado com sucesso');
  };

  // Funções de placas
  const addPlate = async (plateNumber: string, scheduledDate?: Date, observations?: string): Promise<boolean> => {
    if (!user || user.type !== 'transportadora') {
      throw new Error('Apenas transportadoras podem adicionar placas');
    }
    
    if (!validatePlateFormat(plateNumber.toUpperCase())) {
      throw new Error('Formato de placa inválido. Use ABC-1234 ou ABC1D23');
    }

    if (!scheduledDate && !isWithinAllowedTime()) {
      throw new Error('Cadastro de placas não permitido neste horário/dia');
    }

    // Verificar limite de placas
    const userPlates = plates.filter(p => p.transportadoraId === user.id);
    const maxPlates = user.maxPlates || systemConfig.maxPlatesPerTransportadora;
    
    if (userPlates.length >= maxPlates) {
      throw new Error(`Limite de ${maxPlates} placas atingido`);
    }

    try {
      await addPlateToSupabase(
        plateNumber.toUpperCase(),
        user.id,
        user.name,
        scheduledDate?.toISOString(),
        observations
      );
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao adicionar placa');
    }
  };

  const removePlate = async (plateId: string) => {
    if (!user) return;
    
    try {
      await removePlateFromSupabase(plateId);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover placa');
    }
  };

  const getAllPlates = (): Plate[] => {
    if (user?.type === 'admin' || user?.type === 'portaria') {
      return plates;
    }
    return plates.filter(p => p.transportadoraId === user?.id);
  };

  const confirmArrival = async (plateId: string): Promise<boolean> => {
    if (!user || user.type !== 'portaria') {
      throw new Error('Apenas portaria pode confirmar chegadas');
    }

    try {
      await confirmArrivalInSupabase(plateId);
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao confirmar chegada');
    }
  };

  const confirmDeparture = async (plateId: string): Promise<boolean> => {
    if (!user || user.type !== 'portaria') {
      throw new Error('Apenas portaria pode confirmar saídas');
    }

    try {
      await confirmDepartureInSupabase(plateId);
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao confirmar saída');
    }
  };

  // Funções de configuração
  const updateSystemConfig = async (config: SystemConfig) => {
    if (!user || user.type !== 'admin') {
      throw new Error('Apenas administradores podem alterar configurações');
    }

    try {
      await updateConfigInSupabase({
        max_total_plates: config.maxTotalPlates,
        max_plates_per_transportadora: config.maxPlatesPerTransportadora,
        allowed_hours_start: config.allowedHours.start + ':00',
        allowed_hours_end: config.allowedHours.end + ':00',
        allowed_days: config.allowedDays,
      });
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao atualizar configuração');
    }
  };

  // Funções de usuários
  const addUser = async (username: string, password: string, name: string, type: 'admin' | 'transportadora' | 'portaria', maxPlates?: number): Promise<boolean> => {
    if (!user || user.type !== 'admin') {
      throw new Error('Apenas administradores podem gerenciar usuários');
    }

    try {
      await addUserToSupabase(username, name, type, maxPlates);
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao adicionar usuário');
    }
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<boolean> => {
    if (!user || user.type !== 'admin') {
      throw new Error('Apenas administradores podem atualizar usuários');
    }

    try {
      const supabaseUpdates: any = {};
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.username) supabaseUpdates.username = updates.username;
      if (updates.type) supabaseUpdates.type = updates.type;
      if (updates.maxPlates !== undefined) supabaseUpdates.max_plates = updates.maxPlates;

      await updateUserInSupabase(id, supabaseUpdates);
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao atualizar usuário');
    }
  };

  const removeUser = async (id: string): Promise<boolean> => {
    if (!user || user.type !== 'admin') {
      throw new Error('Apenas administradores podem remover usuários');
    }

    try {
      await removeUserFromSupabase(id);
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao remover usuário');
    }
  };

  // Funções legadas para compatibilidade
  const addTransportadora = async (username: string, password: string, name: string): Promise<boolean> => {
    return addUser(username, password, name, 'transportadora', systemConfig.maxPlatesPerTransportadora);
  };

  const removeTransportadora = (id: string) => {
    removeUser(id);
  };

  const updateTransportadoraMaxPlates = (id: string, maxPlates: number) => {
    updateUser(id, { maxPlates });
  };

  // Funções de janelas de agendamento (mantidas por compatibilidade - localStorage)
  const addSchedulingWindow = async (window: Omit<SchedulingWindow, 'id'>): Promise<boolean> => {
    const newWindow = { ...window, id: Date.now().toString() };
    const updatedWindows = [...schedulingWindows, newWindow];
    setSchedulingWindows(updatedWindows);
    localStorage.setItem('schedulingWindows', JSON.stringify(updatedWindows));
    return true;
  };

  const updateSchedulingWindow = async (id: string, updates: Partial<SchedulingWindow>): Promise<boolean> => {
    const updatedWindows = schedulingWindows.map(w => w.id === id ? { ...w, ...updates } : w);
    setSchedulingWindows(updatedWindows);
    localStorage.setItem('schedulingWindows', JSON.stringify(updatedWindows));
    return true;
  };

  const removeSchedulingWindow = async (id: string): Promise<boolean> => {
    const updatedWindows = schedulingWindows.filter(w => w.id !== id);
    setSchedulingWindows(updatedWindows);
    localStorage.setItem('schedulingWindows', JSON.stringify(updatedWindows));
    return true;
  };

  // Funções auxiliares (mantidas por compatibilidade)
  const getTotalAvailableTrips = (): number => {
    return systemConfig.maxTotalPlates - plates.length;
  };

  const getPlatesByDate = (date: Date): Plate[] => {
    const dateStr = date.toDateString();
    return plates.filter(p => p.scheduledDate?.toDateString() === dateStr);
  };

  const getAvailableSchedulingDates = (): { date: Date, timeSlots: string[] }[] => {
    return []; // Implementar se necessário
  };

  const isDateWithinSchedulingWindows = (date: Date): boolean => {
    return true; // Implementar se necessário
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    plates,
    addPlate,
    removePlate,
    getAllPlates,
    confirmArrival,
    confirmDeparture,
    systemConfig,
    updateSystemConfig,
    transportadoras,
    addTransportadora,
    removeTransportadora,
    updateTransportadoraMaxPlates,
    allUsers,
    addUser,
    updateUser,
    removeUser,
    schedulingWindows,
    addSchedulingWindow,
    updateSchedulingWindow,
    removeSchedulingWindow,
    getTotalAvailableTrips,
    getPlatesByDate,
    getAvailableSchedulingDates,
    isDateWithinSchedulingWindows,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};