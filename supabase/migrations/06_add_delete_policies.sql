-- =================================================================
-- 06_ADD_DELETE_POLICIES.SQL
-- Agrega políticas de DELETE para permitir eliminar procesos y datos relacionados
-- =================================================================

-- Política de DELETE para procesos
CREATE POLICY "Permitir eliminación a usuarios autenticados." 
ON public.processes 
FOR DELETE 
TO authenticated 
USING (true);

-- Política de DELETE para etapas
CREATE POLICY "Permitir eliminación a usuarios autenticados." 
ON public.stages 
FOR DELETE 
TO authenticated 
USING (true);

-- Política de DELETE para candidatos
CREATE POLICY "Permitir eliminación a usuarios autenticados." 
ON public.candidates 
FOR DELETE 
TO authenticated 
USING (true);

-- Política de DELETE para timeline
CREATE POLICY "Permitir eliminación a usuarios autenticados." 
ON public.timeline 
FOR DELETE 
TO authenticated 
USING (true);
