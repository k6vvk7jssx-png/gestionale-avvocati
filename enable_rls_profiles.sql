-- 1. Abilita la Row Level Security (RLS) sulla tabella
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Elimina eventuali policy esistenti (opzionale, per evitare duplicati se lo script viene eseguito più volte)
DROP POLICY IF EXISTS "Utenti possono leggere il proprio profilo" ON public.profiles;
DROP POLICY IF EXISTS "Utenti possono creare il proprio profilo" ON public.profiles;
DROP POLICY IF EXISTS "Utenti possono aggiornare il proprio profilo" ON public.profiles;
DROP POLICY IF EXISTS "Utenti possono eliminare il proprio profilo" ON public.profiles;

-- 3. Crea le policy CRUD

-- SELECT: L'utente può leggere solo il proprio profilo
CREATE POLICY "Utenti possono leggere il proprio profilo" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- INSERT: L'utente può creare solo un profilo con il proprio ID
CREATE POLICY "Utenti possono creare il proprio profilo" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- UPDATE: L'utente può modificare solo il proprio profilo
CREATE POLICY "Utenti possono aggiornare il proprio profilo" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- DELETE: L'utente può eliminare solo il proprio profilo (opzionale)
CREATE POLICY "Utenti possono eliminare il proprio profilo" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);

-- NOTA: Se la colonna che identifica l'utente nella tabella `profiles` si chiama `user_id` e non `id`,
-- sostituisci `id` con `user_id` nelle policy sopra.
