import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from '@/hooks/use-toast';

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

export interface SchedulingWindow {
  id: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface SystemConfig {
  maxTotalPlates: number;
  maxPlatesPerTransportadora: number;
  allowedHours: { start: string; end: string };
  allowedDays: number[]; // 0-6 (Sunday-Saturday)
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  plates: Plate[];
  setPlates: React.Dispatch<React.SetStateAction<Plate[]>>;
  saveToStorage: (key: string, data: any) => void;
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
  // Admin user management functions
  allUsers: User[];
  addUser: (username: string, password: string, name: string, type: 'admin' | 'transportadora' | 'portaria', maxPlates?: number) => Promise<boolean>;
  updateUser: (id: string, updates: Partial<User>) => Promise<boolean>;
  updateUserPassword: (id: string, password: string) => Promise<boolean>;
  removeUser: (id: string) => Promise<boolean>;
  // New features
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

// Default users - only used for initial setup if no users exist
const defaultUsers: User[] = [
  { id: '1', username: 'admin', type: 'admin', name: 'Administrador' },
  { id: '2', username: 'transportadora1', type: 'transportadora', name: 'Transportes ABC', maxPlates: 5 },
  { id: '3', username: 'transportadora2', type: 'transportadora', name: 'Logística XYZ', maxPlates: 3 },
  { id: '4', username: 'portaria', type: 'portaria', name: 'Portaria Principal' },
];

const defaultPasswords: { [key: string]: string } = {
  'admin': 'admin123',
  'transportadora1': 'trans123',
  'transportadora2': 'trans456',
  'portaria': 'portaria123',
};

// Sistema adaptado para Vercel - usar apenas localStorage
const getApiBaseUrl = () => {
  // Na Vercel, não temos backend persistente, usar apenas localStorage
  return null; // Forçar uso do localStorage
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [passwords, setPasswords] = useState<{ [key: string]: string }>({});
  const [schedulingWindows, setSchedulingWindows] = useState<SchedulingWindow[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    maxTotalPlates: 50,
    maxPlatesPerTransportadora: 10,
    allowedHours: { start: '08:00', end: '18:00' },
    allowedDays: [1, 2, 3, 4, 5], // Monday to Friday
  });

  // WebSocket handlers
  const handlePlateAdded = (plate: Plate) => {
    setPlates(prev => {
      const exists = prev.some(p => p.id === plate.id);
      if (exists) return prev;
      
      const newPlates = [...prev, {
        ...plate,
        createdAt: new Date(plate.createdAt),
        arrivalConfirmed: plate.arrivalConfirmed ? new Date(plate.arrivalConfirmed) : undefined,
        departureConfirmed: plate.departureConfirmed ? new Date(plate.departureConfirmed) : undefined,
        scheduledDate: plate.scheduledDate ? new Date(plate.scheduledDate) : undefined
      }];
      saveToStorage('plates', newPlates);
      toast({
        title: "Nova placa cadastrada",
        description: `Placa ${plate.number} foi adicionada por ${plate.transportadoraName}`,
      });
      return newPlates;
    });
  };

  const handlePlateUpdated = (plate: Plate) => {
    setPlates(prev => {
      const newPlates = prev.map(p => 
        p.id === plate.id ? {
          ...plate,
          createdAt: new Date(plate.createdAt),
          arrivalConfirmed: plate.arrivalConfirmed ? new Date(plate.arrivalConfirmed) : undefined,
          departureConfirmed: plate.departureConfirmed ? new Date(plate.departureConfirmed) : undefined,
          scheduledDate: plate.scheduledDate ? new Date(plate.scheduledDate) : undefined
        } : p
      );
      saveToStorage('plates', newPlates);
      
      const action = plate.departureConfirmed ? 'saída confirmada' : 'chegada confirmada';
      toast({
        title: "Placa atualizada",
        description: `Placa ${plate.number}: ${action}`,
      });
      return newPlates;
    });
  };

  const handlePlateRemoved = (plateId: string) => {
    setPlates(prev => {
      const newPlates = prev.filter(p => p.id !== plateId);
      saveToStorage('plates', newPlates);
      toast({
        title: "Placa removida",
        description: "Uma placa foi removida do sistema",
      });
      return newPlates;
    });
  };

  // Initialize WebSocket connection
  const { isConnected, connectionError, reconnect } = useWebSocket(
    handlePlateAdded,
    handlePlateUpdated,
    handlePlateRemoved
  );

  useEffect(() => {
    // Load data from localStorage
    const savedUser = localStorage.getItem('user');
    const savedPlates = localStorage.getItem('plates');
    const savedConfig = localStorage.getItem('systemConfig');
    const savedAllUsers = localStorage.getItem('allUsers');
    const savedPasswords = localStorage.getItem('passwords');
    const savedSchedulingWindows = localStorage.getItem('schedulingWindows');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedPlates) {
      const parsedPlates = JSON.parse(savedPlates);
      setPlates(parsedPlates.map((p: any) => ({ 
        ...p, 
        createdAt: new Date(p.createdAt),
        arrivalConfirmed: p.arrivalConfirmed ? new Date(p.arrivalConfirmed) : undefined,
        departureConfirmed: p.departureConfirmed ? new Date(p.departureConfirmed) : undefined,
        scheduledDate: p.scheduledDate ? new Date(p.scheduledDate) : undefined
      })));
    }
    if (savedConfig) {
      setSystemConfig(JSON.parse(savedConfig));
    }
    if (savedSchedulingWindows) {
      const parsedWindows = JSON.parse(savedSchedulingWindows);
      setSchedulingWindows(parsedWindows.map((w: any) => ({
        ...w,
        startDate: new Date(w.startDate),
        endDate: new Date(w.endDate)
      })));
    }
    
    // Initialize users and passwords from localStorage or defaults
    if (savedAllUsers && savedPasswords) {
      setAllUsers(JSON.parse(savedAllUsers));
      setPasswords(JSON.parse(savedPasswords));
    } else {
      // First time setup - use default users and passwords
      setAllUsers(defaultUsers);
      setPasswords(defaultPasswords);
      saveToStorage('allUsers', defaultUsers);
      saveToStorage('passwords', defaultPasswords);
    }
  }, []);

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const saveToStorageWithValidation = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
      throw new Error(`Storage operation failed for ${key}`);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const apiUrl = getApiBaseUrl();
      
      // Se temos backend disponível, tentar usar
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
            saveToStorage('user', data.user);
            await loadPlatesFromBackend();
            return true;
          }
        }
      }
      
      // Usar autenticação local (localStorage)
      const foundUser = allUsers.find(u => u.username === username);
      if (foundUser && passwords[username] === password) {
        setUser(foundUser);
        saveToStorage('user', foundUser);
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('🔄 Usando autenticação local (modo offline)');
      
      // Usar autenticação local
      const foundUser = allUsers.find(u => u.username === username);
      if (foundUser && passwords[username] === password) {
        setUser(foundUser);
        saveToStorage('user', foundUser);
        return true;
      }
      
      return false;
    }
  };

  // Load plates from backend
  const loadPlatesFromBackend = async () => {
    try {
      const apiUrl = getApiBaseUrl();
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/api/plates`);
        if (response.ok) {
          const backendPlates = await response.json();
          const formattedPlates = backendPlates.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            arrivalConfirmed: p.arrivalConfirmed ? new Date(p.arrivalConfirmed) : undefined,
            departureConfirmed: p.departureConfirmed ? new Date(p.departureConfirmed) : undefined,
            scheduledDate: p.scheduledDate ? new Date(p.scheduledDate) : undefined
          }));
          setPlates(formattedPlates);
          saveToStorage('plates', formattedPlates);
        }
      }
    } catch (error) {
      console.log('🔄 Carregando placas do localStorage (modo offline)');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const validatePlateFormat = (plateNumber: string): boolean => {
    // Brazilian plate format: ABC-1234 or ABC1D23
    const oldFormat = /^[A-Z]{3}-\d{4}$/;
    const newFormat = /^[A-Z]{3}\d[A-Z]\d{2}$/;
    return oldFormat.test(plateNumber) || newFormat.test(plateNumber);
  };

  const isWithinAllowedTime = (): boolean => {
    // Allow admin to bypass time restrictions for testing
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

  const addPlate = async (plateNumber: string, scheduledDate?: Date, observations?: string): Promise<boolean> => {
    if (!user || user.type !== 'transportadora') return false;
    
    if (!validatePlateFormat(plateNumber.toUpperCase())) {
      throw new Error('Formato de placa inválido. Use ABC-1234 ou ABC1D23');
    }

    // Only check time restriction for immediate registration, not for scheduled plates
    if (!scheduledDate && !isWithinAllowedTime()) {
      throw new Error('Cadastro de placas não permitido neste horário/dia');
    }

    // Check if plate already exists locally
    if (plates.some(p => p.number === plateNumber.toUpperCase())) {
      throw new Error('Esta placa já está cadastrada');
    }

    // Check user's plate limit
    const userPlates = plates.filter(p => p.transportadoraId === user.id);
    const maxPlates = user.maxPlates || systemConfig.maxPlatesPerTransportadora;
    
    if (userPlates.length >= maxPlates) {
      throw new Error(`Limite de ${maxPlates} placas atingido`);
    }

    // Validate scheduled date if provided
    if (scheduledDate && !isDateWithinSchedulingWindows(scheduledDate)) {
      throw new Error('Data de agendamento não está dentro das janelas permitidas');
    }

    // Usar apenas localStorage na Vercel
    const newPlate: Plate = {
      id: Date.now().toString(),
      number: plateNumber.toUpperCase(),
      transportadoraId: user.id,
      createdAt: new Date(),
      transportadoraName: user.name,
      scheduledDate,
      observations: observations?.trim() || undefined,
    };

    const updatedPlates = [...plates, newPlate];
    setPlates(updatedPlates);
    saveToStorage('plates', updatedPlates);
    
    // Simular notificação em tempo real para outros usuários na mesma sessão
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('plateAdded', { detail: newPlate }));
    }, 100);
    
    return true;
  };

  const removePlate = (plateId: string) => {
    if (!user) return;
    
    const updatedPlates = plates.filter(p => {
      if (user.type === 'admin') {
        return p.id !== plateId;
      }
      return p.id !== plateId && p.transportadoraId === user.id;
    });
    
    setPlates(updatedPlates);
    saveToStorage('plates', updatedPlates);
  };

  const getAllPlates = (): Plate[] => {
    if (user?.type === 'admin' || user?.type === 'portaria') {
      return plates;
    }
    return plates.filter(p => p.transportadoraId === user?.id);
  };

  const confirmArrival = async (plateId: string): Promise<boolean> => {
    if (!user || user.type !== 'portaria') return false;

    // Usar apenas localStorage na Vercel
    const updatedPlates = plates.map(p => 
      p.id === plateId ? { ...p, arrivalConfirmed: new Date() } : p
    );
    
    setPlates(updatedPlates);
    saveToStorage('plates', updatedPlates);
    
    // Simular notificação em tempo real
    const updatedPlate = updatedPlates.find(p => p.id === plateId);
    if (updatedPlate) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('plateUpdated', { detail: updatedPlate }));
      }, 100);
    }
    
    return true;
  };

  const confirmDeparture = async (plateId: string): Promise<boolean> => {
    if (!user || user.type !== 'portaria') return false;

    const plate = plates.find(p => p.id === plateId);
    if (!plate || !plate.arrivalConfirmed) {
      throw new Error('Confirmação de chegada é necessária antes da saída');
    }

    // Usar apenas localStorage na Vercel
    const updatedPlates = plates.map(p => 
      p.id === plateId ? { ...p, departureConfirmed: new Date() } : p
    );
    
    setPlates(updatedPlates);
    saveToStorage('plates', updatedPlates);
    
    // Simular notificação em tempo real
    const updatedPlate = updatedPlates.find(p => p.id === plateId);
    if (updatedPlate) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('plateUpdated', { detail: updatedPlate }));
      }, 100);
    }
    
    return true;
  };

  const updateSystemConfig = (config: SystemConfig) => {
    setSystemConfig(config);
    saveToStorage('systemConfig', config);
  };

  // Legacy transportadora functions for backward compatibility
  const addTransportadora = async (username: string, password: string, name: string): Promise<boolean> => {
    return addUser(username, password, name, 'transportadora', systemConfig.maxPlatesPerTransportadora);
  };

  const removeTransportadora = (id: string) => {
    removeUser(id);
  };

  const updateTransportadoraMaxPlates = (id: string, maxPlates: number) => {
    updateUser(id, { maxPlates });
  };

  // New admin user management functions
  const addUser = async (username: string, password: string, name: string, type: 'admin' | 'transportadora' | 'portaria', maxPlates?: number): Promise<boolean> => {
    if (!user || user.type !== 'admin') {
      throw new Error('Apenas administradores podem gerenciar usuários');
    }

    if (allUsers.some(u => u.username === username)) {
      throw new Error('Nome de usuário já existe');
    }

    console.log(`🔄 Criando novo usuário: ${username} (${type})`);

    const newUser: User = {
      id: Date.now().toString(),
      username,
      type,
      name,
      maxPlates: type === 'transportadora' ? (maxPlates || systemConfig.maxPlatesPerTransportadora) : undefined,
    };

    const updatedUsers = [...allUsers, newUser];
    const updatedPasswords = { ...passwords, [username]: password };
    
    try {
      // Save to storage first
      saveToStorageWithValidation('allUsers', updatedUsers);
      saveToStorageWithValidation('passwords', updatedPasswords);
      
      // Only update state after successful save
      setAllUsers(updatedUsers);
      setPasswords(updatedPasswords);
      
      console.log(`✅ Usuário criado com sucesso: ${username}`);
    } catch (error) {
      console.error(`❌ Erro ao criar usuário ${username}:`, error);
      throw new Error(`Falha ao criar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
    
    return true;
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<boolean> => {
    if (!user || user.type !== 'admin') {
      throw new Error('Apenas administradores podem gerenciar usuários');
    }

    const targetUser = allUsers.find(u => u.id === id);
    if (!targetUser) {
      throw new Error('Usuário não encontrado');
    }

    console.log(`🔄 Atualizando usuário: ${targetUser.username}`);

    const updatedUsers = allUsers.map(u => 
      u.id === id ? { ...u, ...updates } : u
    );
    
    try {
      // Save to storage first
      saveToStorageWithValidation('allUsers', updatedUsers);
      
      // Update current user if they are the one being modified
      if (user.id === id) {
        const updatedCurrentUser = { ...user, ...updates };
        saveToStorageWithValidation('user', updatedCurrentUser);
        setUser(updatedCurrentUser);
      }
      
      // Only update state after successful save
      setAllUsers(updatedUsers);
      
      console.log(`✅ Usuário atualizado com sucesso: ${targetUser.username}`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar usuário ${targetUser.username}:`, error);
      throw new Error(`Falha ao atualizar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
    
    return true;
  };

  const updateUserPassword = async (id: string, password: string): Promise<boolean> => {
    if (!user || user.type !== 'admin') {
      throw new Error('Apenas administradores podem gerenciar usuários');
    }

    const targetUser = allUsers.find(u => u.id === id);
    if (!targetUser) {
      throw new Error('Usuário não encontrado');
    }

    console.log(`🔄 Atualizando senha do usuário: ${targetUser.username}`);

    const updatedPasswords = { ...passwords, [targetUser.username]: password };
    
    try {
      // Save to storage first
      saveToStorageWithValidation('passwords', updatedPasswords);
      
      // Only update state after successful save
      setPasswords(updatedPasswords);
      
      console.log(`✅ Senha atualizada com sucesso para: ${targetUser.username}`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar senha para ${targetUser.username}:`, error);
      throw new Error(`Falha ao atualizar senha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
    
    return true;
  };

  const removeUser = async (id: string): Promise<boolean> => {
    if (!user || user.type !== 'admin') {
      throw new Error('Apenas administradores podem gerenciar usuários');
    }

    const userToRemove = allUsers.find(u => u.id === id);
    if (!userToRemove) {
      throw new Error('Usuário não encontrado');
    }

    // Don't allow removing the current admin user
    if (userToRemove.id === user.id) {
      throw new Error('Não é possível remover o usuário atual');
    }

    console.log(`🔄 Removendo usuário: ${userToRemove.username}`);

    const updatedUsers = allUsers.filter(u => u.id !== id);
    const updatedPasswords = { ...passwords };
    delete updatedPasswords[userToRemove.username];
    
    try {
      // Save to storage first
      saveToStorageWithValidation('allUsers', updatedUsers);
      saveToStorageWithValidation('passwords', updatedPasswords);
      
      // Remove associated plates if it's a transportadora
      if (userToRemove.type === 'transportadora') {
        const updatedPlates = plates.filter(p => p.transportadoraId !== id);
        saveToStorageWithValidation('plates', updatedPlates);
        setPlates(updatedPlates);
      }
      
      // Only update state after successful save
      setAllUsers(updatedUsers);
      setPasswords(updatedPasswords);
      
      console.log(`✅ Usuário removido com sucesso: ${userToRemove.username}`);
    } catch (error) {
      console.error(`❌ Erro ao remover usuário ${userToRemove.username}:`, error);
      throw new Error(`Falha ao remover usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
    
    return true;
  };

  // New helper functions
  const getTotalAvailableTrips = (): number => {
    return transportadoras
      .filter(u => u.type === 'transportadora')
      .reduce((total, user) => total + (user.maxPlates || systemConfig.maxPlatesPerTransportadora), 0);
  };

  const getAvailableSchedulingDates = (): { date: Date, timeSlots: string[] }[] => {
    const availableDates: { date: Date, timeSlots: string[] }[] = [];
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    // Check each day for the next 30 days
    for (let d = new Date(today.getTime() + (24 * 60 * 60 * 1000)); d <= thirtyDaysFromNow; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d);
      const dayOfWeek = currentDate.getDay();
      
      // Skip if day is not allowed globally
      if (!systemConfig.allowedDays.includes(dayOfWeek)) continue;
      
      const timeSlots: string[] = [];
      
      // Check global time slots
      const [startHour, startMinute] = systemConfig.allowedHours.start.split(':').map(Number);
      const [endHour, endMinute] = systemConfig.allowedHours.end.split(':').map(Number);
      
      for (let hour = startHour; hour <= endHour; hour++) {
        for (let minute = (hour === startHour ? startMinute : 0); minute < 60; minute += 30) {
          if (hour === endHour && minute > endMinute) break;
          
          const testDate = new Date(currentDate);
          testDate.setHours(hour, minute, 0, 0);
          
          if (isDateWithinSchedulingWindows(testDate)) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
          }
        }
      }
      
      if (timeSlots.length > 0) {
        availableDates.push({ date: currentDate, timeSlots });
      }
    }
    
    return availableDates;
  };

  const isDateWithinSchedulingWindows = (date: Date): boolean => {
    // Check if it's within global allowed days and hours
    const dayOfWeek = date.getDay();
    if (!systemConfig.allowedDays.includes(dayOfWeek)) {
      return false;
    }

    const hour = date.getHours();
    const minute = date.getMinutes();
    const timeInMinutes = hour * 60 + minute;
    
    const [startHour, startMinute] = systemConfig.allowedHours.start.split(':').map(Number);
    const [endHour, endMinute] = systemConfig.allowedHours.end.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    if (timeInMinutes < startTimeInMinutes || timeInMinutes > endTimeInMinutes) {
      return false;
    }

    // If there are active scheduling windows, check if date is within them
    const activeWindows = schedulingWindows.filter(w => w.isActive);
    if (activeWindows.length === 0) {
      return true; // No specific windows, global settings apply
    }
    
    return activeWindows.some(window => {
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const startDateOnly = new Date(window.startDate.getFullYear(), window.startDate.getMonth(), window.startDate.getDate());
      const endDateOnly = new Date(window.endDate.getFullYear(), window.endDate.getMonth(), window.endDate.getDate());
      
      // Check if date is within window period
      if (dateOnly < startDateOnly || dateOnly > endDateOnly) {
        return false;
      }

      // Check if time is within window hours
      const [winStartHour, winStartMinute] = window.startTime.split(':').map(Number);
      const [winEndHour, winEndMinute] = window.endTime.split(':').map(Number);
      const winStartTimeInMinutes = winStartHour * 60 + winStartMinute;
      const winEndTimeInMinutes = winEndHour * 60 + winEndMinute;
      
      return timeInMinutes >= winStartTimeInMinutes && timeInMinutes <= winEndTimeInMinutes;
    });
  };

  const getPlatesByDate = (date: Date): Plate[] => {
    const dateStr = date.toDateString();
    console.log('getPlatesByDate called with:', dateStr);
    console.log('Total plates in system:', plates.length);
    console.log('All plates:', plates.map(p => ({
      id: p.id,
      number: p.number,
      createdAt: p.createdAt.toDateString(),
      scheduledDate: p.scheduledDate?.toDateString(),
      arrivalConfirmed: p.arrivalConfirmed?.toDateString(),
      departureConfirmed: p.departureConfirmed?.toDateString()
    })));
    
    const result = plates.filter(plate => {
      // Include plates created on this date
      if (plate.createdAt.toDateString() === dateStr) {
        console.log('Found plate by createdAt:', plate.number);
        return true;
      }
      
      // Include plates scheduled for this date
      if (plate.scheduledDate && plate.scheduledDate.toDateString() === dateStr) {
        console.log('Found plate by scheduledDate:', plate.number);
        return true;
      }
      
      // Include plates that arrived on this date
      if (plate.arrivalConfirmed && plate.arrivalConfirmed.toDateString() === dateStr) {
        console.log('Found plate by arrivalConfirmed:', plate.number);
        return true;
      }
      
      // Include plates that departed on this date
      if (plate.departureConfirmed && plate.departureConfirmed.toDateString() === dateStr) {
        console.log('Found plate by departureConfirmed:', plate.number);
        return true;
      }
      
      return false;
    });
    
    console.log('Filtered plates result:', result.length);
    return result;
  };

  // Scheduling window management functions
  const addSchedulingWindow = async (window: Omit<SchedulingWindow, 'id'>): Promise<boolean> => {
    if (!user || user.type !== 'admin') {
      throw new Error('Apenas administradores podem gerenciar janelas de agendamento');
    }

    const newWindow: SchedulingWindow = {
      ...window,
      id: Date.now().toString(),
    };

    const updatedWindows = [...schedulingWindows, newWindow];
    setSchedulingWindows(updatedWindows);
    saveToStorage('schedulingWindows', updatedWindows);
    return true;
  };

  const updateSchedulingWindow = async (id: string, updates: Partial<SchedulingWindow>): Promise<boolean> => {
    if (!user || user.type !== 'admin') {
      throw new Error('Apenas administradores podem gerenciar janelas de agendamento');
    }

    const updatedWindows = schedulingWindows.map(w => 
      w.id === id ? { ...w, ...updates } : w
    );
    
    setSchedulingWindows(updatedWindows);
    saveToStorage('schedulingWindows', updatedWindows);
    return true;
  };

  const removeSchedulingWindow = async (id: string): Promise<boolean> => {
    if (!user || user.type !== 'admin') {
      throw new Error('Apenas administradores podem gerenciar janelas de agendamento');
    }

    const updatedWindows = schedulingWindows.filter(w => w.id !== id);
    setSchedulingWindows(updatedWindows);
    saveToStorage('schedulingWindows', updatedWindows);
    return true;
  };

  // Get transportadoras for backward compatibility
  const transportadoras = allUsers.filter(u => u.type === 'transportadora');

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      plates,
      setPlates,
      saveToStorage,
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
      updateUserPassword,
      removeUser,
      schedulingWindows,
      addSchedulingWindow,
      updateSchedulingWindow,
      removeSchedulingWindow,
      getTotalAvailableTrips,
      getPlatesByDate,
      getAvailableSchedulingDates,
      isDateWithinSchedulingWindows,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};