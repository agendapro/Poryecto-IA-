-- =================================================================
-- 04_ADD_EMAIL_NOTIFICATIONS.SQL
-- Script para agregar funcionalidad de envío de correos a las notificaciones
-- =================================================================

-- 1. Agregar campo email a la tabla profiles (si no existe)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Actualizar emails desde auth.users
UPDATE public.profiles 
SET email = auth.users.email
FROM auth.users 
WHERE public.profiles.id = auth.users.id 
AND public.profiles.email IS NULL;

-- 3. Función para obtener email por nombre del responsable
CREATE OR REPLACE FUNCTION public.get_responsible_email(p_responsible_name TEXT)
RETURNS TEXT AS $$
DECLARE
    v_email TEXT;
BEGIN
    -- Buscar el email del responsable por nombre
    SELECT email INTO v_email
    FROM public.profiles
    WHERE full_name = p_responsible_name
    LIMIT 1;
    
    -- Si no se encuentra, retornar null
    RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función mejorada para crear notificación con email
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
    v_responsible_email TEXT;
    v_notification_id BIGINT;
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

    -- Solo proceder si hay un responsable asignado y no es "Sistema"
    IF v_new_stage.responsible IS NULL 
       OR v_new_stage.responsible = '' 
       OR v_new_stage.responsible = 'Sistema' THEN
        RETURN;
    END IF;

    -- Obtener email del responsable
    v_responsible_email := public.get_responsible_email(v_new_stage.responsible);

    -- Crear mensaje personalizado
    v_message := 'El candidato ' || v_candidate.name || 
                 ' está ahora en tu etapa "' || v_new_stage.name || 
                 '" para el puesto de ' || v_process.title || 
                 '. Movido por: ' || p_moved_by;

    -- Crear notificación en base de datos
    INSERT INTO public.notifications (
        recipient_name,
        recipient_email,
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
        v_responsible_email,
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
    ) RETURNING id INTO v_notification_id;

    -- Simular envío de email (aquí puedes integrar con un servicio real)
    IF v_responsible_email IS NOT NULL THEN
        -- Esta función simula el envío de email
        -- En producción, aquí integrarías con SendGrid, Resend, etc.
        RAISE NOTICE 'EMAIL SIMULADO enviado a: % | Asunto: Nuevo candidato en tu etapa | Mensaje: %', 
                     v_responsible_email, v_message;
        
        -- Marcar como email enviado (opcional)
        INSERT INTO public.email_log (
            notification_id,
            recipient_email,
            subject,
            message,
            status,
            sent_at
        ) VALUES (
            v_notification_id,
            v_responsible_email,
            'Nuevo candidato en tu etapa: ' || v_new_stage.name,
            v_message,
            'simulated', -- 'sent' en producción
            NOW()
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Log el error pero no fallar la operación principal
        RAISE WARNING 'Error creating notification with email: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Tabla para log de emails enviados
CREATE TABLE IF NOT EXISTS public.email_log (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    notification_id BIGINT REFERENCES public.notifications(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'simulated'
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error_message TEXT NULL
);

-- 6. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_email_log_notification ON public.email_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON public.email_log(status);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON public.email_log(sent_at DESC);

-- 7. Habilitar RLS en email_log
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

-- 8. Políticas para email_log
CREATE POLICY "Permitir lectura a usuarios autenticados." ON public.email_log 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserción a usuarios autenticados." ON public.email_log 
    FOR INSERT TO authenticated WITH CHECK (true);

-- 9. Habilitar Realtime para email_log
ALTER TABLE public.email_log REPLICA IDENTITY FULL;
