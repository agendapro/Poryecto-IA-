-- =================================================================
-- 00_INITIAL_SCHEMA.SQL
-- Script consolidado para la configuración inicial de la base de datos de RecruitPro.
-- Sigue la secuencia: Diagnóstico > Limpieza > Estructura > Triggers > Datos > RLS.
-- =================================================================

-- Paso 1 y 2: Diagnóstico y Limpieza
-- =================================================================
-- Se eliminan todos los objetos en orden inverso a su creación para evitar errores de dependencia.

-- Políticas de Seguridad (RLS)
DROP POLICY IF EXISTS "Permitir a usuarios autenticados subir CVs." ON storage.objects;
DROP POLICY IF EXISTS "Permitir a usuarios autenticados ver sus propios CVs." ON storage.objects;

-- Triggers y Funciones
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_all_users_with_profiles();

-- Publicaciones (para Realtime)
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Tablas (en orden de dependencia inversa)
DROP TABLE IF EXISTS public.timeline CASCADE;
DROP TABLE IF EXISTS public.candidates CASCADE;
DROP TABLE IF EXISTS public.stages CASCADE;
DROP TABLE IF EXISTS public.processes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Tipos de datos personalizados
DROP TYPE IF EXISTS public.user_role;

-- Paso 3: Estructura de la Base de Datos
-- =================================================================

-- Crear tabla para los procesos de reclutamiento
CREATE TABLE public.processes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    description TEXT,
    manager TEXT,
    salary_range TEXT,
    status TEXT NOT NULL DEFAULT 'Activo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear tabla para las etapas del proceso
CREATE TABLE public.stages (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    process_id BIGINT NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    responsible TEXT,
    "order" INT NOT NULL
);

-- Crear tabla para los candidatos
CREATE TABLE public.candidates (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    process_id BIGINT NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    origen TEXT,
    cv TEXT, -- URL al archivo en Supabase Storage
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
    comments INT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Activo',
    current_stage_id BIGINT REFERENCES public.stages(id)
);

-- Crear tabla para el timeline de eventos
CREATE TABLE public.timeline (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    candidate_id BIGINT REFERENCES public.candidates(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    author TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    icon TEXT
);

-- Crear tipo ENUM para los roles de usuario
CREATE TYPE public.user_role AS ENUM (
    'Administrador',
    'Reclutador',
    'Manager',
    'Colaborador'
);

-- Crear tabla de perfiles de usuario, vinculada a auth.users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role public.user_role NOT NULL
);

-- Crear un bucket en Supabase Storage para los CVs
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO NOTHING;


-- Paso 4: Triggers y Funciones
-- =================================================================

-- Función para crear un perfil automáticamente al registrar un nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', 'Reclutador'); -- Asigna rol por defecto
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que ejecuta la función anterior después de cada registro
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Función RPC para que los administradores puedan obtener todos los usuarios
CREATE OR REPLACE FUNCTION public.get_all_users_with_profiles()
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    role public.user_role
) AS $$
BEGIN
    -- Se verifica que el usuario que llama a la función sea administrador usando LIMIT 1 para optimizar
    IF (
        SELECT p.role FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1
    ) <> 'Administrador' THEN
        RAISE EXCEPTION 'Acción restringida a administradores.';
    END IF;

    RETURN QUERY
    SELECT u.id, u.email, p.full_name, p.role
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Paso 5: Inserción de Datos de Ejemplo
-- =================================================================

-- Insertar un proceso de ejemplo
INSERT INTO public.processes (id, title, description, manager, salary_range, status)
OVERRIDING SYSTEM VALUE
VALUES (1, 'Desarrollador Frontend Senior', 'Buscamos un desarrollador frontend senior con experiencia en React, TypeScript y Next.js.', 'Ana García', '$80,000 - $100,000', 'Activo')
ON CONFLICT (id) DO UPDATE SET 
title = EXCLUDED.title, 
description = EXCLUDED.description, 
manager = EXCLUDED.manager, 
salary_range = EXCLUDED.salary_range, 
status = EXCLUDED.status;


-- Insertar etapas para el proceso 1
INSERT INTO public.stages (process_id, name, responsible, "order") VALUES
(1, 'Aplicación', 'Sistema', 1),
(1, 'Revisión CV', 'Ana García', 2),
(1, 'Entrevista Técnica', 'Juan Pérez', 3),
(1, 'Entrevista Final', 'Ana García', 4),
(1, 'Oferta', 'RRHH', 5),
(1, 'Contratado', 'RRHH', 6);

-- Insertar candidatos para el proceso 1
INSERT INTO public.candidates (process_id, name, email, phone, location, origen, applied_date, last_updated, comments, status, current_stage_id) VALUES
(1, 'Carlos Mendoza', 'carlos@email.com', '+1234567890', 'Madrid, España', 'LinkedIn', '2024-01-20', '2024-07-28', 3, 'Activo', 1),
(1, 'Laura Fernández', 'laura@email.com', '+1234567891', 'Barcelona, España', 'Referido', '2024-01-19', '2024-07-25', 1, 'Activo', 1),
(1, 'Miguel Torres', 'miguel@email.com', '+1234567892', 'Valencia, España', 'Web', '2024-01-18', '2024-07-22', 2, 'Activo', 2),
(1, 'Sofia Ruiz', 'sofia@email.com', '+1234567893', 'Sevilla, España', 'Indeed', '2024-01-17', '2024-06-10', 5, 'Activo', 3);

-- Insertar eventos en timeline
INSERT INTO public.timeline (candidate_id, type, title, description, author, date, icon) VALUES
(1, 'application', 'Candidato aplicó al proceso', 'Se registró en el proceso.', 'Sistema', '2024-01-20T10:00:00Z', 'User'),
(2, 'application', 'Candidato aplicó al proceso', 'Se registró en el proceso.', 'Sistema', '2024-01-19T10:00:00Z', 'User'),
(3, 'application', 'Candidato aplicó al proceso', 'Se registró en el proceso.', 'Sistema', '2024-01-18T10:00:00Z', 'User'),
(4, 'application', 'Candidato aplicó al proceso', 'Se registró en el proceso.', 'Sistema', '2024-01-17T10:00:00Z', 'User');


-- Paso 6: Habilitación de RLS y Políticas de Seguridad
-- =================================================================

-- Habilitar Realtime
ALTER TABLE public.processes REPLICA IDENTITY FULL;
ALTER TABLE public.stages REPLICA IDENTITY FULL;
ALTER TABLE public.candidates REPLICA IDENTITY FULL;
ALTER TABLE public.timeline REPLICA IDENTITY FULL;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- Habilitar RLS en todas las tablas
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para 'profiles'
CREATE POLICY "Los perfiles públicos son visibles para todos." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Los usuarios pueden insertar su propio perfil." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Los usuarios pueden actualizar su propio perfil." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para 'processes', 'stages', 'candidates', 'timeline'
CREATE POLICY "Permitir lectura a usuarios autenticados." ON public.processes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir lectura a usuarios autenticados." ON public.stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir lectura a usuarios autenticados." ON public.candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir inserción a usuarios autenticados." ON public.candidates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir actualización a usuarios autenticados." ON public.candidates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Permitir lectura a usuarios autenticados." ON public.timeline FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir inserción a usuarios autenticados." ON public.timeline FOR INSERT TO authenticated WITH CHECK (true);

-- Políticas para Storage (Bucket 'cvs')
CREATE POLICY "Permitir a usuarios autenticados subir CVs." ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Permitir a usuarios autenticados ver sus propios CVs." ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);
