-- Habilitar REPLICA IDENTITY FULL para capturar mudanças completas
ALTER TABLE public.plates REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.system_config REPLICA IDENTITY FULL;
ALTER TABLE public.scheduling_windows REPLICA IDENTITY FULL;