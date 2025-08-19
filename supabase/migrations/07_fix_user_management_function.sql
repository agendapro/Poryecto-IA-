-- =================================================================
-- 07_FIX_USER_MANAGEMENT_FUNCTION.SQL
-- Arregla la función para obtener usuarios con sus perfiles
-- =================================================================

-- Eliminar la función existente para recrearla
DROP FUNCTION IF EXISTS public.get_all_users_with_profiles();

-- Recrear la función con tipos más específicos
CREATE OR REPLACE FUNCTION public.get_all_users_with_profiles()
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT
) AS $$
BEGIN
    -- Verificar que el usuario que llama sea administrador
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'Administrador'
    ) THEN
        RAISE EXCEPTION 'Acción restringida a administradores.';
    END IF;

    -- Retornar la consulta
    RETURN QUERY
    SELECT 
        u.id::UUID,
        u.email::TEXT,
        COALESCE(p.full_name, 'Sin nombre')::TEXT,
        COALESCE(p.role::TEXT, 'Sin rol')::TEXT
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE u.email IS NOT NULL
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
