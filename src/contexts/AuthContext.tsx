import React, { createContext, useContext, useState, useEffect } from 'react';

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
  addPlate: (plateNumber: string) => Promise<boolean>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [passwords, setPasswords] = useState<{ [key: string]: string }>({});
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    maxTotalPlates: 50,
    maxPlatesPerTransportadora: 10,
    allowedHours: { start: '08:00', end: '18:00' },
    allowedDays: [1, 2, 3, 4, 5], // Monday to Friday
  });

  useEffect(() => {
    // Load data from localStorage
    const savedUser = localStorage.getItem('user');
    const savedPlates = localStorage.getItem('plates');
    const savedConfig = localStorage.getItem('systemConfig');
    const savedAllUsers = localStorage.getItem('allUsers');
    const savedPasswords = localStorage.getItem('passwords');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedPlates) {
      const parsedPlates = JSON.parse(savedPlates);
      setPlates(parsedPlates.map((p: any) => ({ 
        ...p, 
        createdAt: new Date(p.createdAt),
        arrivalConfirmed: p.arrivalConfirmed ? new Date(p.arrivalConfirmed) : undefined,
        departureConfirmed: p.departureConfirmed ? new Date(p.departureConfirmed) : undefined
      })));
    }
    if (savedConfig) {
      setSystemConfig(JSON.parse(savedConfig));
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

  const login = async (username: string, password: string): Promise<boolean> => {
    const foundUser = allUsers.find(u => u.username === username);
    
    if (foundUser && passwords[username] === password) {
      setUser(foundUser);
      saveToStorage('user', foundUser);
      return true;
    }
    return false;
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

  const addPlate = async (plateNumber: string): Promise<boolean> => {
    if (!user || user.type !== 'transportadora') return false;
    
    if (!validatePlateFormat(plateNumber.toUpperCase())) {
      throw new Error('Formato de placa inválido. Use ABC-1234 ou ABC1D23');
    }

    if (!isWithinAllowedTime()) {
      throw new Error('Cadastro de placas não permitido neste horário/dia');
    }

    // Check if plate already exists
    if (plates.some(p => p.number === plateNumber.toUpperCase())) {
      throw new Error('Esta placa já está cadastrada');
    }

    // Check user's plate limit
    const userPlates = plates.filter(p => p.transportadoraId === user.id);
    const maxPlates = user.maxPlates || systemConfig.maxPlatesPerTransportadora;
    
    if (userPlates.length >= maxPlates) {
      throw new Error(`Limite de ${maxPlates} placas atingido`);
    }

    // Check total system limit
    if (plates.length >= systemConfig.maxTotalPlates) {
      throw new Error('Limite total de placas do sistema atingido');
    }

    const newPlate: Plate = {
      id: Date.now().toString(),
      number: plateNumber.toUpperCase(),
      transportadoraId: user.id,
      createdAt: new Date(),
      transportadoraName: user.name,
    };

    const updatedPlates = [...plates, newPlate];
    setPlates(updatedPlates);
    saveToStorage('plates', updatedPlates);
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

    const updatedPlates = plates.map(p => 
      p.id === plateId ? { ...p, arrivalConfirmed: new Date() } : p
    );
    
    setPlates(updatedPlates);
    saveToStorage('plates', updatedPlates);
    return true;
  };

  const confirmDeparture = async (plateId: string): Promise<boolean> => {
    if (!user || user.type !== 'portaria') return false;

    const plate = plates.find(p => p.id === plateId);
    if (!plate || !plate.arrivalConfirmed) {
      throw new Error('Confirmação de chegada é necessária antes da saída');
    }

    const updatedPlates = plates.map(p => 
      p.id === plateId ? { ...p, departureConfirmed: new Date() } : p
    );
    
    setPlates(updatedPlates);
    saveToStorage('plates', updatedPlates);
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

    const newUser: User = {
      id: Date.now().toString(),
      username,
      type,
      name,
      maxPlates: type === 'transportadora' ? (maxPlates || systemConfig.maxPlatesPerTransportadora) : undefined,
    };

    const updatedUsers = [...allUsers, newUser];
    const updatedPasswords = { ...passwords, [username]: password };
    
    setAllUsers(updatedUsers);
    setPasswords(updatedPasswords);
    saveToStorage('allUsers', updatedUsers);
    saveToStorage('passwords', updatedPasswords);
    
    return true;
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<boolean> => {
    if (!user || user.type !== 'admin') {
      throw new Error('Apenas administradores podem gerenciar usuários');
    }

    const updatedUsers = allUsers.map(u => 
      u.id === id ? { ...u, ...updates } : u
    );
    
    setAllUsers(updatedUsers);
    saveToStorage('allUsers', updatedUsers);
    
    // Update current user if they are the one being modified
    if (user.id === id) {
      const updatedCurrentUser = { ...user, ...updates };
      setUser(updatedCurrentUser);
      saveToStorage('user', updatedCurrentUser);
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

    const updatedPasswords = { ...passwords, [targetUser.username]: password };
    setPasswords(updatedPasswords);
    saveToStorage('passwords', updatedPasswords);
    
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

    const updatedUsers = allUsers.filter(u => u.id !== id);
    const updatedPasswords = { ...passwords };
    delete updatedPasswords[userToRemove.username];
    
    setAllUsers(updatedUsers);
    setPasswords(updatedPasswords);
    saveToStorage('allUsers', updatedUsers);
    saveToStorage('passwords', updatedPasswords);
    
    // Remove associated plates if it's a transportadora
    if (userToRemove.type === 'transportadora') {
      const updatedPlates = plates.filter(p => p.transportadoraId !== id);
      setPlates(updatedPlates);
      saveToStorage('plates', updatedPlates);
    }
    
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