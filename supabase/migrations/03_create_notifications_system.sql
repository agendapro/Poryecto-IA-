-- =================================================================
-- 03_CREATE_NOTIFICATIONS_SYSTEM.SQL
-- Script para crear el sistema de notificaciones cuando se mueven candidatos
-- =================================================================

-- 1. Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    recipient_name TEXT NOT NULL, -- Nombre del responsable de la etapa
    recipient_email TEXT, -- Email del responsable (opcional)
    candidate_id BIGINT NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    candidate_name TEXT NOT NULL,
    process_id BIGINT NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
    process_title TEXT NOT NULL,
    stage_id BIGINT NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'stage_movement',
    status TEXT NOT NULL DEFAULT 'unread', -- 'unread', 'read', 'dismissed'
    moved_by TEXT NOT NULL, -- Quien movió al candidato
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ NULL
);

-- 2. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_name);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_candidate ON public.notifications(candidate_id);

-- 3. Habilitar RLS en notificaciones
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para notificaciones
CREATE POLICY "Permitir lectura a usuarios autenticados." ON public.notifications 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserción a usuarios autenticados." ON public.notifications 
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados." ON public.notifications 
    FOR UPDATE TO authenticated USING (true);

-- 5. Función para crear notificación cuando se mueve un candidato
CREATE OR REPLACE FUNCTION public.create_stage_movement_notification(
    p_candidate_id BIGINT,
    p_new_stage_id BIGINT,
    p_moved_by TEXT
)
RETURNS void AS $$
DECLARE
    v_candidate public.candidates%ROWTYPE;
    v_process public.processes%ROWTYPE;
    v_new_stage public.stages%ROWTYPE;
    v_message TEXT;
BEGIN
    -- Obtener información del candidato
    SELECT * INTO v_candidate
    FROM public.candidates
    WHERE id = p_candidate_id;

    -- Obtener información del proceso
    SELECT * INTO v_process
    FROM public.processes
    WHERE id = v_candidate.process_id;

    -- Obtener información de la nueva etapa
    SELECT * INTO v_new_stage
    FROM public.stages
    WHERE id = p_new_stage_id;

    -- Verificar que todos los datos existen
    IF v_candidate.id IS NULL OR v_process.id IS NULL OR v_new_stage.id IS NULL THEN
        RETURN; -- Salir silenciosamente si faltan datos
    END IF;

    -- Crear mensaje personalizado
    v_message := 'El candidato ' || v_candidate.name || 
                 ' está ahora en tu etapa "' || v_new_stage.name || 
                 '" para el puesto de ' || v_process.title || 
                 '. Movido por: ' || p_moved_by;

    -- Solo crear notificación si hay un responsable asignado y no es "Sistema"
    IF v_new_stage.responsible IS NOT NULL 
       AND v_new_stage.responsible != '' 
       AND v_new_stage.responsible != 'Sistema' THEN
        
        INSERT INTO public.notifications (
            recipient_name,
            candidate_id,
            candidate_name,
            process_id,
            process_title,
            stage_id,
            stage_name,
            message,
            type,
            status,
            moved_by
        ) VALUES (
            v_new_stage.responsible,
            v_candidate.id,
            v_candidate.name,
            v_process.id,
            v_process.title,
            v_new_stage.id,
            v_new_stage.name,
            v_message,
            'stage_movement',
            'unread',
            p_moved_by
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Log el error pero no fallar la operación principal
        RAISE WARNING 'Error creating notification: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función para marcar notificación como leída
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(p_notification_id BIGINT)
RETURNS void AS $$
BEGIN
    UPDATE public.notifications
    SET status = 'read', read_at = NOW()
    WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función para obtener notificaciones de un usuario
CREATE OR REPLACE FUNCTION public.get_notifications_for_user(p_user_name TEXT)
RETURNS TABLE (
    id BIGINT,
    recipient_name TEXT,
    candidate_name TEXT,
    process_title TEXT,
    stage_name TEXT,
    message TEXT,
    status TEXT,
    moved_by TEXT,
    created_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.recipient_name,
        n.candidate_name,
        n.process_title,
        n.stage_name,
        n.message,
        n.status,
        n.moved_by,
        n.created_at,
        n.read_at
    FROM public.notifications n
    WHERE n.recipient_name = p_user_name
    ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Habilitar Realtime para notificaciones
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
