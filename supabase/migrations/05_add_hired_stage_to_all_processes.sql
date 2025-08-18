-- =================================================================
-- 05_ADD_HIRED_STAGE_TO_ALL_PROCESSES.SQL
-- Asegura que todos los procesos tengan la etapa "Contratado"
-- =================================================================

-- Función para agregar la etapa "Contratado" a un proceso específico si no existe
CREATE OR REPLACE FUNCTION add_hired_stage_to_process(process_id_param BIGINT)
RETURNS VOID AS $$
DECLARE
    max_order INT;
BEGIN
    -- Verificar si ya existe la etapa "Contratado" en este proceso
    IF NOT EXISTS (
        SELECT 1 FROM public.stages 
        WHERE process_id = process_id_param AND name = 'Contratado'
    ) THEN
        -- Obtener el orden máximo actual para este proceso
        SELECT COALESCE(MAX("order"), 0) + 1 INTO max_order
        FROM public.stages 
        WHERE process_id = process_id_param;
        
        -- Insertar la etapa "Contratado"
        INSERT INTO public.stages (process_id, name, responsible, "order")
        VALUES (process_id_param, 'Contratado', 'RRHH', max_order);
        
        RAISE NOTICE 'Etapa "Contratado" agregada al proceso %', process_id_param;
    ELSE
        RAISE NOTICE 'El proceso % ya tiene la etapa "Contratado"', process_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Agregar la etapa "Contratado" a todos los procesos existentes que no la tengan
DO $$
DECLARE
    process_record RECORD;
BEGIN
    FOR process_record IN SELECT id FROM public.processes LOOP
        PERFORM add_hired_stage_to_process(process_record.id);
    END LOOP;
END $$;

-- Función trigger para agregar automáticamente la etapa "Contratado" a nuevos procesos
CREATE OR REPLACE FUNCTION add_hired_stage_to_new_process()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar la etapa "Contratado" como la última etapa del nuevo proceso
    INSERT INTO public.stages (process_id, name, responsible, "order")
    VALUES (NEW.id, 'Contratado', 'RRHH', 999);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta después de insertar un nuevo proceso
DROP TRIGGER IF EXISTS add_hired_stage_trigger ON public.processes;
CREATE TRIGGER add_hired_stage_trigger
    AFTER INSERT ON public.processes
    FOR EACH ROW
    EXECUTE FUNCTION add_hired_stage_to_new_process();

-- Limpiar la función auxiliar (ya no la necesitamos)
DROP FUNCTION IF EXISTS add_hired_stage_to_process(BIGINT);
