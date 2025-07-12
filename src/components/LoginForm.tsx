
import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Truck, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        toast.success('Login realizado com sucesso!');
      } else {
        toast.error('Credenciais inválidas');
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center transport-gradient p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="glass-effect border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Truck className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Sistema de Gestão de Placas
            </CardTitle>
            <CardDescription className="text-white/80">
              Faça login para acessar o sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white font-medium">
                  Usuário
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60 backdrop-blur-sm"
                  placeholder="Digite seu usuário"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60 backdrop-blur-sm"
                  placeholder="Digite sua senha"
                />
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition-all duration-200"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-white" />
                <span className="text-white font-medium text-sm">Credenciais de Teste:</span>
              </div>
              <div className="space-y-1 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  <span>Admin: admin / admin123</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-3 h-3" />
                  <span>Transportadora: transportadora1 / trans123</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-3 h-3" />
                  <span>Transportadora: transportadora2 / trans456</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  <span>Portaria: portaria / portaria123</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Watermark */}
        <div className="mt-4 text-center">
          <p className="text-white/40 text-xs font-light tracking-wide">
            Created and Made by Higor Vinicius
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
