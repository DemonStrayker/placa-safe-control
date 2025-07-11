import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RotateCcw } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

const WebSocketStatus: React.FC = () => {
  // Mock handlers for the status component - actual handlers are in AuthContext
  const mockHandlers = {
    onPlateAdded: () => {},
    onPlateUpdated: () => {},
    onPlateRemoved: () => {}
  };
  
  const { isConnected, connectionError, reconnect } = useWebSocket(
    mockHandlers.onPlateAdded,
    mockHandlers.onPlateUpdated,
    mockHandlers.onPlateRemoved
  );

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isConnected ? "default" : "destructive"}
        className="flex items-center gap-1"
      >
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            Tempo Real Ativo
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Desconectado
          </>
        )}
      </Badge>
      
      {connectionError && (
        <Button
          variant="outline"
          size="sm"
          onClick={reconnect}
          className="flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          Reconectar
        </Button>
      )}
      
      {connectionError && (
        <span className="text-xs text-muted-foreground">
          {connectionError}
        </span>
      )}
    </div>
  );
};

export default WebSocketStatus;