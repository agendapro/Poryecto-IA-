"use client"

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

// Types (alineados con la BD)
export interface Candidate {
  id: number
  process_id: number
  name: string
  email: string
  phone: string | null
  location: string | null
  origen: string | null
  cv?: string | null
  applied_date: string
  last_updated: string
  comments: number
  status: string
  current_stage_id: number
}

export interface TimelineEvent {
  id: number
  candidate_id: number
  type: "application" | "comment" | "stage_change" | "movement"
  title: string
  description: string
  author: string
  date: string
  icon: any
}

export interface Stage {
  id: number
  process_id: number
  name: string
  responsible: string | null
  order: number
}

export interface Notification {
  id: number
  recipient_name: string
  recipient_email?: string
  candidate_id: number
  candidate_name: string
  process_id: number
  process_title: string
  stage_id: number
  stage_name: string
  message: string
  type: string
  status: string
  moved_by: string
  created_at: string
  read_at?: string
}

export interface Process {
  id: number
  title: string
  description: string | null
  manager: string | null
  salary_range: string | null
  status: string
  created_at: string
}

interface RecruitmentContextType {
  candidates: Candidate[]
  stages: Stage[]
  processes: Process[]
  loading: boolean
  moveCandidateToStage: (candidateId: number, newStageId: number, author?: string) => Promise<void>
  addTimelineEvent: (candidateId: number, event: Omit<TimelineEvent, "id" | "candidate_id">) => Promise<void>
  getCandidatesByStage: (stageId: number) => Candidate[]
  getCandidate: (candidateId: number) => Candidate | undefined
  getNextStage: (currentStageId: number) => Stage | undefined
  addCandidate: (
    candidateData: Omit<Candidate, "id" | "comments" | "status" | "applied_date" | "last_updated"> & { cvFile?: File },
  ) => Promise<Candidate | undefined>
  rejectCandidate: (candidateId: number, reason: string, author?: string) => Promise<void>
  getRejectedCandidates: () => Candidate[]
  getRejectedCandidatesByProcess: (processId: number) => Candidate[]
  getProcess: (processId: number) => Process | undefined
  getStagesByProcess: (processId: number) => Stage[]
  createProcess: (processData: {
    title: string
    description: string
    manager: string
    salary_range?: string
    stages: Array<{ name: string; responsible?: string }>
  }) => Promise<Process>
  updateProcess: (processId: number, processData: {
    title: string
    description: string
    manager: string
    salary_range?: string
    status: string
  }) => Promise<Process | undefined>
  deleteProcess: (processId: number) => Promise<void>
  uploadCV: (file: File, candidateId?: number) => Promise<string>
  downloadCV: (cvUrl: string) => Promise<void>
  updateCandidateCV: (candidateId: number, cvUrl: string) => Promise<void>
  notifications: Notification[]
  getNotificationsForUser: (userName: string) => Notification[]
  markNotificationAsRead: (notificationId: number) => Promise<void>
  getUnreadNotificationsCount: (userName: string) => number
}

const RecruitmentContext = createContext<RecruitmentContextType | undefined>(undefined)

// Comprobar si las credenciales de Supabase están configuradas
const useSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function RecruitmentProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [processes, setProcesses] = useState<Process[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [authSession, setAuthSession] = useState<any>(null)
  const [dataInitialized, setDataInitialized] = useState(false)

  const fetchInitialData = useCallback(async () => {
    if (!useSupabase) {
      console.error("Supabase no está configurado. Verifica las variables de entorno.")
      setLoading(false)
      return
    }

    setLoading(true)
    const { data: processesData, error: processesError } = await supabase.from("processes").select("*").order("id")
          const { data: stagesData, error: stagesError } = await supabase.from("stages").select("*").order("process_id, order")
      const { data: candidatesData, error: candidatesError } = await supabase.from("candidates").select("*")
      const { data: notificationsData, error: notificationsError } = await supabase.from("notifications").select("*").order("created_at", { ascending: false })

    if (processesError) console.error("Error fetching processes:", processesError)
    else setProcesses(processesData || [])

    if (stagesError) console.error("Error fetching stages:", stagesError)
    else setStages(stagesData || [])

          if (candidatesError) console.error("Error fetching candidates:", candidatesError)
      else setCandidates(candidatesData || [])

      if (notificationsError) console.error("Error fetching notifications:", notificationsError)
      else setNotifications(notificationsData || [])

    setLoading(false)
    setDataInitialized(true)
  }, [])

  // Monitorear sesión de autenticación
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setAuthSession(session)
      if (session && !dataInitialized) {
        fetchInitialData()
      }
    }

    getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.id)
      setAuthSession(session)
      
      // Solo cargar datos en login real, no en cambios de pestaña o refreshes de token
      if (event === 'SIGNED_IN' && !dataInitialized) {
        console.log('📊 User signed in, fetching data...')
        fetchInitialData()
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out, clearing data...')
        setCandidates([])
        setStages([])
        setProcesses([])
        setNotifications([])
        setDataInitialized(false)
        setLoading(false)
      }
      // Ignorar otros eventos como TOKEN_REFRESHED que ocurren al cambiar pestañas
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [fetchInitialData, dataInitialized])

  useEffect(() => {
    if (!useSupabase || !authSession) return

    // Real-time para candidatos
    const handleCandidateChanges = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
      console.log('Realtime candidates event:', payload.eventType, payload)
      
      if (payload.eventType === "INSERT") {
        // Solo agregar si no existe ya (evitar duplicados por la actualización manual)
        setCandidates(prev => {
          const exists = prev.find(c => c.id === payload.new.id)
          if (exists) return prev
          return [...prev, payload.new as Candidate]
        })
      }
      if (payload.eventType === "UPDATE") {
        setCandidates((prev) =>
          prev.map((c) => (c.id === payload.new.id ? (payload.new as Candidate) : c)),
        )
      }
      if (payload.eventType === "DELETE") {
        setCandidates((prev) => prev.filter((c) => c.id !== payload.old.id))
      }
    }

    // Real-time para procesos
    const handleProcessChanges = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
      console.log('Realtime processes event:', payload.eventType, payload)
      
      if (payload.eventType === "INSERT") {
        setProcesses(prev => {
          const exists = prev.find(p => p.id === payload.new.id)
          if (exists) return prev
          return [...prev, payload.new as Process]
        })
      }
      if (payload.eventType === "UPDATE") {
        setProcesses(prev => prev.map(p => p.id === payload.new.id ? payload.new as Process : p))
      }
      if (payload.eventType === "DELETE") {
        setProcesses(prev => prev.filter(p => p.id !== payload.old.id))
      }
    }

    // Real-time para etapas
    const handleStageChanges = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
      console.log('Realtime stages event:', payload.eventType, payload)
      
      if (payload.eventType === "INSERT") {
        setStages(prev => {
          const exists = prev.find(s => s.id === payload.new.id)
          if (exists) return prev
          return [...prev, payload.new as Stage]
        })
      }
      if (payload.eventType === "UPDATE") {
        setStages(prev => prev.map(s => s.id === payload.new.id ? payload.new as Stage : s))
      }
      if (payload.eventType === "DELETE") {
        setStages(prev => prev.filter(s => s.id !== payload.old.id))
      }
    }

    // Suscripciones a realtime
    const candidatesChannel = supabase
      .channel("realtime:candidates")
      .on("postgres_changes", { event: "*", schema: "public", table: "candidates" }, handleCandidateChanges)
      .subscribe()

    const processesChannel = supabase
      .channel("realtime:processes")
      .on("postgres_changes", { event: "*", schema: "public", table: "processes" }, handleProcessChanges)
      .subscribe()

    const stagesChannel = supabase
      .channel("realtime:stages")
      .on("postgres_changes", { event: "*", schema: "public", table: "stages" }, handleStageChanges)
      .subscribe()

    return () => {
      supabase.removeChannel(candidatesChannel)
      supabase.removeChannel(processesChannel)
      supabase.removeChannel(stagesChannel)
    }
  }, [authSession])

  const moveCandidateToStage = async (candidateId: number, newStageId: number, author = "Usuario") => {
    if (!useSupabase) return

    const candidate = getCandidate(candidateId)
    const currentStage = stages.find((s) => s.id === candidate?.current_stage_id)
    const newStage = stages.find((s) => s.id === newStageId)
    if (!newStage || !candidate) return

    const updateData: any = {
      current_stage_id: newStageId,
      last_updated: new Date().toISOString(),
    }

    // Si el candidato está rechazado y se mueve a una etapa normal, reactivarlo
    if (candidate.status === "Rechazado") {
      updateData.status = "Activo"
    }

    // Actualizar candidato en Supabase
    const { error } = await supabase
      .from("candidates")
      .update(updateData)
      .eq("id", candidateId)

    if (error) {
      console.error("Error moving candidate:", error)
      return
    }

    // Actualizar estado local inmediatamente
    setCandidates(prev => 
      prev.map(c => 
        c.id === candidateId 
          ? { ...c, ...updateData }
          : c
      )
    )

    // Añadir evento al timeline
    const timelineEvent = candidate.status === "Rechazado" 
      ? {
          type: "stage_change" as const,
          title: "",
          description: `Movido desde Rechazados a "${newStage.name}"`,
          author,
          date: new Date().toISOString(),
          icon: "RotateCcw",
        }
      : {
          type: "stage_change" as const,
          title: "",
          description: currentStage ? `El candidato fue movido de "${currentStage.name}" a "${newStage.name}"` : `Movido a "${newStage.name}"`,
          author,
          date: new Date().toISOString(),
          icon: "ArrowRight",
        }

    await addTimelineEvent(candidateId, timelineEvent)

    // Crear notificación para el responsable de la nueva etapa
    try {
      const { error: notificationError } = await supabase.rpc('create_stage_movement_notification', {
        p_candidate_id: candidateId,
        p_new_stage_id: newStageId,
        p_moved_by: author
      })

      if (notificationError) {
        console.error("Error creating notification:", notificationError)
        // No lanzar error aquí, la notificación es secundaria
      } else {
        // Refrescar notificaciones después de crear una nueva
        await fetchNotifications()
        
        // Enviar email real con Resend
        await sendNotificationEmail(candidateId, newStageId, author)
      }
    } catch (notificationError) {
      console.error("Error calling notification function:", notificationError)
      // No lanzar error aquí, la notificación es secundaria
    }
  }

  const fetchNotifications = async () => {
    if (!useSupabase) return

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching notifications:", error)
      } else {
        setNotifications(data || [])
      }
    } catch (error) {
      console.error("Error in fetchNotifications:", error)
    }
  }

  const addTimelineEvent = async (candidateId: number, event: Omit<TimelineEvent, "id" | "candidate_id">) => {
    if (!useSupabase) return

    const { error } = await supabase.from("timeline").insert([{ candidate_id: candidateId, ...event }])
    if (error) {
      console.error("Error adding timeline event:", error)
      throw new Error(`Error al agregar evento al timeline: ${error.message}`)
    }
  }

  const getCandidatesByStage = (stageId: number) => {
    return candidates.filter((candidate) => 
      candidate.current_stage_id === stageId && candidate.status !== "Rechazado"
    )
  }

  const getCandidate = (candidateId: number) => {
    return candidates.find((candidate) => candidate.id === candidateId)
  }

  const getNextStage = (currentStageId: number) => {
    const currentStage = stages.find((s) => s.id === currentStageId)
    if (!currentStage) return undefined
    return stages.find((s) => s.order === currentStage.order + 1)
  }

  const uploadCV = async (file: File, candidateId?: number): Promise<string> => {
    if (!useSupabase) throw new Error("Supabase not available")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error("Usuario no autenticado")

      // Crear nombre único para el archivo
      const timestamp = new Date().getTime()
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `${user.id}/${fileName}`

      // Subir archivo a Storage
      const { data, error } = await supabase.storage
        .from('cvs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error("Error uploading file:", error)
        throw new Error(`Error al subir archivo: ${error.message}`)
      }

      // Obtener URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('cvs')
        .getPublicUrl(filePath)

      if (!publicUrl) {
        throw new Error("No se pudo generar URL pública del archivo")
      }

      return publicUrl
    } catch (error) {
      console.error("Error in uploadCV:", error)
      throw error
    }
  }

  const downloadCV = async (cvUrl: string): Promise<void> => {
    if (!cvUrl) {
      alert("No hay URL de CV disponible")
      return
    }
    
    try {
      // Verificar si la URL es válida
      if (!cvUrl.startsWith('http')) {
        throw new Error("URL de CV inválida")
      }
      
      // Abrir en nueva pestaña para visualizar/descargar
      window.open(cvUrl, '_blank')
    } catch (error) {
      console.error("Error downloading CV:", error)
      alert(`Error al abrir CV: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  const updateCandidateCV = async (candidateId: number, cvUrl: string): Promise<void> => {
    if (!useSupabase) return

    try {
      const { error } = await supabase
        .from("candidates")
        .update({ cv: cvUrl, last_updated: new Date().toISOString() })
        .eq("id", candidateId)

      if (error) {
        console.error("Error updating candidate CV:", error)
        throw new Error(`Error al actualizar CV: ${error.message}`)
      }

      // Actualizar estado local inmediatamente
      setCandidates(prev => 
        prev.map(c => 
          c.id === candidateId 
            ? { ...c, cv: cvUrl, last_updated: new Date().toISOString() }
            : c
        )
      )
    } catch (error) {
      console.error("Error in updateCandidateCV:", error)
      throw error
    }
  }

  const addCandidate = async (
    candidateData: Omit<Candidate, "id" | "comments" | "status" | "applied_date" | "last_updated"> & { cvFile?: File },
  ): Promise<Candidate | undefined> => {
    if (!useSupabase) return undefined

    const currentDate = new Date().toISOString().split("T")[0]
    
    // Separar el archivo del resto de datos
    const { cvFile, ...restData } = candidateData
    let cvUrl = restData.cv

    // Si hay un archivo, subirlo primero
    if (cvFile) {
      try {
        cvUrl = await uploadCV(cvFile)
      } catch (error) {
        console.error("Error uploading CV:", error)
        throw new Error("Error al subir el CV")
      }
    }

    const newCandidateData = {
      ...restData,
      cv: cvUrl,
      applied_date: currentDate,
      last_updated: currentDate,
      comments: 0,
      status: 'Activo'
    }

    // Insertar y obtener los datos del candidato creado
    const { data, error } = await supabase
      .from("candidates")
      .insert([newCandidateData])
      .select()
      .single()

    if (error) {
      console.error("Error adding candidate:", error)
      throw error
    }

    // Actualizar el estado local inmediatamente
    setCandidates(prev => [...prev, data])

    // Agregar evento al timeline
    await addTimelineEvent(data.id, {
      type: "application",
      title: "",
      description: `Se registró en el proceso desde ${candidateData.origen}`,
      author: "Sistema",
      date: new Date().toISOString(),
      icon: "User",
    })

    return data
  }

  const rejectCandidate = async (candidateId: number, reason: string, author = "Usuario") => {
    if (!useSupabase) return

    try {
      // Mantener el current_stage_id actual, solo cambiar el status
      const updateData = {
        status: "Rechazado",
        last_updated: new Date().toISOString()
      }

      const { error } = await supabase
        .from("candidates")
        .update(updateData)
        .eq("id", candidateId)

      if (error) {
        console.error("Error rejecting candidate:", error)
        throw new Error(`Error en base de datos: ${error.message}`)
      }

      // Actualizar estado local inmediatamente
      setCandidates(prev => 
        prev.map(c => 
          c.id === candidateId 
            ? { ...c, ...updateData }
            : c
        )
      )

      // Agregar evento al timeline
      try {
        await addTimelineEvent(candidateId, {
          type: "movement",
          title: "",
          description: `Motivo: ${reason}`,
          author,
          date: new Date().toISOString(),
          icon: "X",
        })
      } catch (timelineError) {
        console.error("Error adding timeline event:", timelineError)
        // No lanzar error aquí, el candidato ya fue rechazado exitosamente
      }
    } catch (error) {
      console.error("Error in rejectCandidate:", error)
      throw error
    }
  }

  const getRejectedCandidates = () => {
    return candidates.filter((candidate) => candidate.status === "Rechazado")
  }

  const getRejectedCandidatesByProcess = (processId: number) => {
    return candidates.filter((candidate) => 
      candidate.status === "Rechazado" && candidate.process_id === processId
    )
  }

  const getProcess = (processId: number) => {
    return processes.find(p => p.id === processId)
  }

  const getStagesByProcess = (processId: number) => {
    return stages.filter(stage => stage.process_id === processId).sort((a, b) => a.order - b.order)
  }

  const createProcess = async (processData: {
    title: string
    description: string
    manager: string
    salary_range?: string
    stages: Array<{ name: string; responsible?: string }>
  }): Promise<Process> => {
    if (!useSupabase) {
      throw new Error("Supabase no está configurado")
    }

    // Crear el proceso
    const { data: processResult, error: processError } = await supabase
      .from('processes')
      .insert({
        title: processData.title,
        description: processData.description,
        manager: processData.manager,
        salary_range: processData.salary_range || null,
        status: 'Activo'
      })
      .select()
      .single()

    if (processError) {
      throw new Error(`Error al crear proceso: ${processError.message}`)
    }

    // Crear las etapas
    const stagesWithOrder = processData.stages.map((stage, index) => ({
      process_id: processResult.id,
      name: stage.name,
      responsible: stage.responsible || null,
      order: index + 1
    }))

    const { error: stagesError } = await supabase
      .from('stages')
      .insert(stagesWithOrder)

    if (stagesError) {
      throw new Error(`Error al crear etapas: ${stagesError.message}`)
    }

    return processResult
  }

  const updateProcess = async (processId: number, processData: {
    title: string
    description: string
    manager: string
    salary_range?: string
    status: string
  }): Promise<Process | undefined> => {
    if (!useSupabase) {
      throw new Error("Supabase no está configurado")
    }

    // Actualizar el proceso en Supabase
    const { data: processResult, error: processError } = await supabase
      .from('processes')
      .update({
        title: processData.title,
        description: processData.description,
        manager: processData.manager,
        salary_range: processData.salary_range || null,
        status: processData.status
      })
      .eq('id', processId)
      .select()
      .single()

    if (processError) {
      throw new Error(`Error al actualizar proceso: ${processError.message}`)
    }

    // Actualizar estado local inmediatamente
    setProcesses(prev => 
      prev.map(p => 
        p.id === processId ? processResult : p
      )
    )

    return processResult
  }

  const deleteProcess = async (processId: number): Promise<void> => {
    console.log('🔄 deleteProcess called with processId:', processId)
    
    if (!useSupabase) {
      console.error('❌ Supabase not configured')
      throw new Error("Supabase no está configurado")
    }

    console.log('🗄️ Attempting to delete from Supabase...')
    
    // Eliminar el proceso de Supabase (CASCADE eliminará stages, candidates y timeline relacionados)
    const { error: processError } = await supabase
      .from('processes')
      .delete()
      .eq('id', processId)

    if (processError) {
      console.error('💥 Supabase delete error:', processError)
      throw new Error(`Error al eliminar proceso: ${processError.message}`)
    }

    console.log('✅ Supabase delete successful, updating local state...')

    // Actualizar el estado local inmediatamente
    setProcesses(prev => {
      const newProcesses = prev.filter(p => p.id !== processId)
      console.log('📊 Processes before:', prev.length, 'after:', newProcesses.length)
      return newProcesses
    })
    
    setCandidates(prev => {
      const newCandidates = prev.filter(c => c.process_id !== processId)
      console.log('👥 Candidates before:', prev.length, 'after:', newCandidates.length)
      return newCandidates
    })
    
    setStages(prev => {
      const newStages = prev.filter(s => s.process_id !== processId)
      console.log('🏗️ Stages before:', prev.length, 'after:', newStages.length)
      return newStages
    })
    
    console.log('🎉 Process deleted successfully:', processId)
  }

  const getNotificationsForUser = (userName: string): Notification[] => {
    return notifications.filter(notification => 
      notification.recipient_name === userName
    )
  }

  const markNotificationAsRead = async (notificationId: number): Promise<void> => {
    if (!useSupabase) return

    try {
      const { error } = await supabase.rpc('mark_notification_as_read', {
        p_notification_id: notificationId
      })

      if (error) {
        console.error("Error marking notification as read:", error)
        throw error
      }

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'read', read_at: new Date().toISOString() }
            : n
        )
      )
    } catch (error) {
      console.error("Error in markNotificationAsRead:", error)
      throw error
    }
  }

  const getUnreadNotificationsCount = (userName: string): number => {
    return notifications.filter(n => 
      n.recipient_name === userName && n.status === 'unread'
    ).length
  }

  const sendNotificationEmail = async (candidateId: number, newStageId: number, movedBy: string) => {
    try {
      console.log('🚀 Iniciando sendNotificationEmail:', { candidateId, newStageId, movedBy });
      
      // Obtener información necesaria
      const candidate = candidates.find(c => c.id === candidateId)
      const newStage = stages.find(s => s.id === newStageId)
      const process = candidate ? processes.find(p => p.id === candidate.process_id) : null

      console.log('📋 Información obtenida:', { 
        candidate: candidate?.name, 
        newStage: newStage?.name, 
        process: process?.title,
        responsible: newStage?.responsible 
      });

      if (!candidate || !newStage || !process) {
        console.warn("❌ No se puede enviar email: falta información del candidato, etapa o proceso")
        return
      }

      // Solo enviar email si hay un responsable asignado y no es "Sistema"
      if (!newStage.responsible || newStage.responsible === 'Sistema') {
        console.log("ℹ️ No se envía email: etapa sin responsable o es 'Sistema'")
        return
      }

      // Obtener email del responsable desde la base de datos
      console.log('🔍 Buscando email para responsable:', newStage.responsible);
      const { data: responsibleProfile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('full_name', newStage.responsible)
        .single()

      console.log('📧 Resultado búsqueda email:', { responsibleProfile, profileError });

      if (!responsibleProfile?.email) {
        console.warn(`❌ No se encontró email para el responsable: ${newStage.responsible}`)
        return
      }

      // Preparar datos para el API
      const emailData = {
        recipientEmail: responsibleProfile.email,
        recipientName: newStage.responsible,
        candidateName: candidate.name,
        stageName: newStage.name,
        processTitle: process.title,
        movedBy: movedBy
      };

      console.log('📤 Enviando request al API:', emailData);

      // Llamar a la API de envío de emails
      const response = await fetch('/api/send-notification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      })

      console.log('📬 Respuesta del API - Status:', response.status);
      console.log('📬 Respuesta del API - OK:', response.ok);

      const result = await response.json()
      console.log('📬 Respuesta del API - Body:', result);

      if (response.ok) {
        console.log('✅ Email enviado exitosamente:', result)
      } else {
        console.error('❌ Error enviando email:', result)
      }

    } catch (error) {
      console.error('❌ Error crítico en sendNotificationEmail:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  return (
    <RecruitmentContext.Provider
      value={{
        candidates,
        stages,
        processes,
        notifications,
        loading,
        moveCandidateToStage,
        addTimelineEvent,
        getCandidatesByStage,
        getCandidate,
        getNextStage,
        addCandidate,
        rejectCandidate,
        getRejectedCandidates,
        getRejectedCandidatesByProcess,
        getProcess: (id: number) => processes.find(p => p.id === id),
        getStagesByProcess,
        createProcess,
        updateProcess,
        deleteProcess,
        uploadCV,
        downloadCV,
        updateCandidateCV,
        getNotificationsForUser,
        markNotificationAsRead,
        getUnreadNotificationsCount,
      }}
    >
      {children}
    </RecruitmentContext.Provider>
  )
}

export function useRecruitment() {
  const context = useContext(RecruitmentContext)
  if (context === undefined) {
    throw new Error("useRecruitment must be used within a RecruitmentProvider")
  }
  return context
}
