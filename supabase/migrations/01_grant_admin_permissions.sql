-- =================================================================
-- 01_GRANT_ADMIN_PERMISSIONS.SQL
-- Script para otorgar permisos de administrador a jorgenavarro@agendapro.com
-- =================================================================

-- Actualizar el rol del usuario a 'Administrador' si ya existe en profiles
UPDATE public.profiles 
SET role = 'Administrador'
WHERE id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'jorgenavarro@agendapro.com'
    LIMIT 1
);

-- Si el usuario no tiene perfil pero existe en auth.users, crear el perfil
INSERT INTO public.profiles (id, full_name, role)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Jorge Navarro') as full_name,
    'Administrador'::public.user_role as role
FROM auth.users u
WHERE u.email = 'jorgenavarro@agendapro.com'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Verificar que la actualización fue exitosa
SELECT 
    u.email,
    p.full_name,
    p.role
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'jorgenavarro@agendapro.com';
