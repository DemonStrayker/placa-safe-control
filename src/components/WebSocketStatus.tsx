import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Database } from 'lucide-react';

const WebSocketStatus: React.FC = () => {
  // Na Vercel, sempre usar modo offline
  const isVercel = window.location.hostname.includes('vercel.app');

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isVercel ? "secondary" : "destructive"}
        className="flex items-center gap-1"
      >
        {isVercel ? (
          <>
            <Database className="h-3 w-3" />
            Modo Offline
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Desconectado
          </>
        )}
      </Badge>

      {isVercel && (
        <span className="text-xs text-muted-foreground max-w-xs truncate">
          Dados salvos localmente
        </span>
      )}
    </div>
  );
};

export default WebSocketStatus;