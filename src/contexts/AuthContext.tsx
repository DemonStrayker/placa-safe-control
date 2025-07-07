import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  type: 'admin' | 'transportadora';
  name: string;
  maxPlates?: number;
}

export interface Plate {
  id: string;
  number: string;
  transportadoraId: string;
  createdAt: Date;
  transportadoraName: string;
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
  systemConfig: SystemConfig;
  updateSystemConfig: (config: SystemConfig) => void;
  transportadoras: User[];
  addTransportadora: (username: string, password: string, name: string) => Promise<boolean>;
  removeTransportadora: (id: string) => void;
  updateTransportadoraMaxPlates: (id: string, maxPlates: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data
const mockUsers: User[] = [
  { id: '1', username: 'admin', type: 'admin', name: 'Administrador' },
  { id: '2', username: 'transportadora1', type: 'transportadora', name: 'Transportes ABC', maxPlates: 5 },
  { id: '3', username: 'transportadora2', type: 'transportadora', name: 'Logística XYZ', maxPlates: 3 },
];

const mockPasswords: { [key: string]: string } = {
  'admin': 'admin123',
  'transportadora1': 'trans123',
  'transportadora2': 'trans456',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [transportadoras, setTransportadoras] = useState<User[]>(mockUsers.filter(u => u.type === 'transportadora'));
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
    const savedTransportadoras = localStorage.getItem('transportadoras');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedPlates) {
      const parsedPlates = JSON.parse(savedPlates);
      setPlates(parsedPlates.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt) })));
    }
    if (savedConfig) {
      setSystemConfig(JSON.parse(savedConfig));
    }
    if (savedTransportadoras) {
      setTransportadoras(JSON.parse(savedTransportadoras));
    }
  }, []);

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    const foundUser = [...mockUsers, ...transportadoras].find(u => u.username === username);
    
    if (foundUser && mockPasswords[username] === password) {
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
    if (user?.type === 'admin') {
      return plates;
    }
    return plates.filter(p => p.transportadoraId === user?.id);
  };

  const updateSystemConfig = (config: SystemConfig) => {
    setSystemConfig(config);
    saveToStorage('systemConfig', config);
  };

  const addTransportadora = async (username: string, password: string, name: string): Promise<boolean> => {
    if (transportadoras.some(t => t.username === username)) {
      throw new Error('Nome de usuário já existe');
    }

    const newTransportadora: User = {
      id: Date.now().toString(),
      username,
      type: 'transportadora',
      name,
      maxPlates: systemConfig.maxPlatesPerTransportadora,
    };

    const updatedTransportadoras = [...transportadoras, newTransportadora];
    setTransportadoras(updatedTransportadoras);
    saveToStorage('transportadoras', updatedTransportadoras);
    
    // Add password to mock passwords
    mockPasswords[username] = password;
    
    return true;
  };

  const removeTransportadora = (id: string) => {
    const updatedTransportadoras = transportadoras.filter(t => t.id !== id);
    setTransportadoras(updatedTransportadoras);
    saveToStorage('transportadoras', updatedTransportadoras);
    
    // Remove associated plates
    const updatedPlates = plates.filter(p => p.transportadoraId !== id);
    setPlates(updatedPlates);
    saveToStorage('plates', updatedPlates);
  };

  const updateTransportadoraMaxPlates = (id: string, maxPlates: number) => {
    // Update transportadoras list
    const updatedTransportadoras = transportadoras.map(t => 
      t.id === id ? { ...t, maxPlates } : t
    );
    setTransportadoras(updatedTransportadoras);
    saveToStorage('transportadoras', updatedTransportadoras);
    
    // Update current user if they are the one being modified
    if (user && user.id === id) {
      const updatedUser = { ...user, maxPlates };
      setUser(updatedUser);
      saveToStorage('user', updatedUser);
    }
    
    // Update mockUsers array for future logins
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = { ...mockUsers[userIndex], maxPlates };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      plates,
      addPlate,
      removePlate,
      getAllPlates,
      systemConfig,
      updateSystemConfig,
      transportadoras,
      addTransportadora,
      removeTransportadora,
      updateTransportadoraMaxPlates,
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
