import { useEffect, useRef, useState } from 'react';
import { Plate } from '@/contexts/AuthContext';

interface WebSocketMessage {
  type: 'PLATE_ADDED' | 'PLATE_UPDATED' | 'PLATE_REMOVED';
  plate: Plate;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionError: string | null;
  reconnect: () => void;
}

// WebSocket não é suportado na Vercel (serverless)
// Sistema adaptado para funcionar apenas com localStorage
const getWebSocketUrl = () => {
  // Desabilitar WebSocket na produção (Vercel)
  if (window.location.hostname.includes('vercel.app')) {
    return null; // Não tentar conectar WebSocket na Vercel
  }
  
  // Durante desenvolvimento, usar localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'ws://localhost:8080';
  }
  
  return null; // Desabilitar por padrão
};

export const useWebSocket = (
  onPlateAdded: (plate: Plate) => void,
  onPlateUpdated: (plate: Plate) => void,
  onPlateRemoved: (plateId: string) => void
): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const connect = () => {
    try {
      const wsUrl = getWebSocketUrl();
      
      if (!wsUrl) {
        console.log('🔄 WebSocket desabilitado na produção (Vercel)');
        setConnectionError('Modo offline - WebSocket desabilitado na produção');
        return;
      }
      
      if (wsUrl.includes('YOUR_NGROK')) {
        setConnectionError('URL do ngrok não configurado');
        return;
      }
      
      console.log('🔗 Conectando ao WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket conectado com sucesso');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Mensagem WebSocket recebida:', message);

          switch (message.type) {
            case 'PLATE_ADDED':
              onPlateAdded(message.plate);
              break;
            case 'PLATE_UPDATED':
              onPlateUpdated(message.plate);
              break;
            case 'PLATE_REMOVED':
              onPlateRemoved(message.plate.id);
              break;
            default:
              console.warn('⚠️ Tipo de mensagem WebSocket desconhecido:', message.type);
          }
        } catch (error) {
          console.error('❌ Erro ao processar mensagem WebSocket:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket desconectado. Código:', event.code, 'Razão:', event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if it wasn't a manual close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          setConnectionError(`Conexão perdida. Tentativa de reconexão ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Tentativa de reconexão ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
            connect();
          }, reconnectDelay * reconnectAttemptsRef.current);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError('Não foi possível estabelecer conexão. Verifique se o servidor está rodando.');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ Erro no WebSocket:', error);
        setConnectionError('Erro de conexão WebSocket');
      };

    } catch (error) {
      console.error('❌ Erro ao criar conexão WebSocket:', error);
      setConnectionError('Erro ao criar conexão WebSocket');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
  };

  const reconnect = () => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  };

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    connectionError,
    reconnect
  };
};