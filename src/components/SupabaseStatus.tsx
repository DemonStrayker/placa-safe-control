import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Database, WifiOff, Wifi } from 'lucide-react';

export const SupabaseStatus: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <Database className="w-4 h-4 text-green-600" />
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <Wifi className="w-3 h-3 mr-1" />
        Supabase Conectado
      </Badge>
    </div>
  );
};