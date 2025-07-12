-- Habilitar real-time para todas as tabelas
ALTER TABLE public.plates REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.system_config REPLICA IDENTITY FULL;
ALTER TABLE public.scheduling_windows REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.plates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduling_windows;