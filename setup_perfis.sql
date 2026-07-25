-- Execute este código no painel do Supabase -> SQL Editor

-- 1. Permitir que usuários recém-criados insiram seu próprio perfil
CREATE POLICY "Permitir inserção de perfil" ON public.profiles
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Caso você esteja criando contas onde o usuário não está autenticado imediatamente,
-- Ou apenas para garantir que o sistema não barre a criação:
-- (Remova o comentário da linha abaixo caso a política acima não seja suficiente)
-- CREATE POLICY "Permitir inserção publica" ON public.profiles FOR INSERT WITH CHECK (true);
