-- =================================================================
-- 02_CREATE_STORAGE_BUCKET.SQL
-- Script para crear el bucket de Storage para CVs y sus políticas
-- =================================================================

-- 1. Crear el bucket para CVs (público para facilitar acceso)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Eliminar políticas existentes si existen (para recrearlas)
DROP POLICY IF EXISTS "Permitir a usuarios autenticados subir CVs." ON storage.objects;
DROP POLICY IF EXISTS "Permitir a usuarios autenticados ver CVs." ON storage.objects;
DROP POLICY IF EXISTS "Permitir lectura pública de CVs." ON storage.objects;

-- 3. Política para subir CVs (solo usuarios autenticados)
CREATE POLICY "Permitir a usuarios autenticados subir CVs." ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'cvs');

-- 4. Política para leer CVs (público)
CREATE POLICY "Permitir lectura pública de CVs." ON storage.objects
    FOR SELECT
    USING (bucket_id = 'cvs');

-- 5. Política para actualizar CVs (solo el propietario)
CREATE POLICY "Permitir a usuarios autenticados actualizar sus CVs." ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 6. Política para eliminar CVs (solo el propietario)
CREATE POLICY "Permitir a usuarios autenticados eliminar sus CVs." ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);
