"use client"

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

// Types (alineados con la BD)
export interface Candidate {
  id: number
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
  name: string
  responsible: string | null
  order: number
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
  moveCandidateToStage: (candidateId: number, newStageId: number, author?: string) => Promise<void>
  addTimelineEvent: (candidateId: number, event: Omit<TimelineEvent, "id" | "candidate_id">) => Promise<void>
  getCandidatesByStage: (stageId: number) => Candidate[]
  getCandidate: (candidateId: number) => Candidate | undefined
  getNextStage: (currentStageId: number) => Stage | undefined
  addCandidate: (
    candidateData: Omit<Candidate, "id" | "comments" | "status" | "applied_date" | "last_updated">,
  ) => Promise<void>
  rejectCandidate: (candidateId: number, reason: string, author?: string) => Promise<void>
  getRejectedCandidates: () => Candidate[]
  getProcess: (processId: number) => Process | undefined
}

const RecruitmentContext = createContext<RecruitmentContextType | undefined>(undefined)

// Comprobar si las credenciales de Supabase están configuradas
const useSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function RecruitmentProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInitialData = useCallback(async () => {
    if (!useSupabase) {
      console.log("Supabase no configurado, usando mocks...")
      // Aquí se podrían cargar los mocks si se quisiera mantener ese fallback
      setLoading(false)
      return
    }

    setLoading(true)
    const { data: processesData, error: processesError } = await supabase.from("processes").select("*").order("id")
    const { data: stagesData, error: stagesError } = await supabase.from("stages").select("*").order("order")
    const { data: candidatesData, error: candidatesError } = await supabase.from("candidates").select("*")

    if (processesError) console.error("Error fetching processes:", processesError)
    else setProcesses(processesData || [])

    if (stagesError) console.error("Error fetching stages:", stagesError)
    else setStages(stagesData || [])

    if (candidatesError) console.error("Error fetching candidates:", candidatesError)
    else setCandidates(candidatesData || [])

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchInitialData()

    if (!useSupabase) return

    const handleRealtimeChanges = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
      if (payload.eventType === "INSERT") {
        // Candidate insert
        setCandidates(prev => [...prev, payload.new as Candidate])
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

    const channel = supabase
      .channel("public:candidates")
      .on("postgres_changes", { event: "*", schema: "public", table: "candidates" }, handleRealtimeChanges)
      .subscribe()

    // Real-time processes
    const channelProc = supabase
      .channel("public:processes")
      .on("postgres_changes", { event: "*", schema: "public", table: "processes" }, (payload) => {
        if (payload.eventType === "INSERT") setProcesses(prev => [...prev, payload.new as Process])
        if (payload.eventType === "UPDATE") setProcesses(prev => prev.map(p=>p.id===payload.new.id?payload.new as Process:p))
        if (payload.eventType === "DELETE") setProcesses(prev => prev.filter(p=>p.id!==payload.old.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(channelProc)
    }
  }, [fetchInitialData])

  const moveCandidateToStage = async (candidateId: number, newStageId: number, author = "Usuario") => {
    if (!useSupabase) return

    const currentStage = stages.find((s) => s.id === getCandidate(candidateId)?.current_stage_id)
    const newStage = stages.find((s) => s.id === newStageId)
    if (!currentStage || !newStage) return

    // Actualizar candidato
    const { error } = await supabase
      .from("candidates")
      .update({
        current_stage_id: newStageId,
        last_updated: new Date().toISOString(),
      })
      .eq("id", candidateId)

    if (error) {
      console.error("Error moving candidate:", error)
      return
    }

    // Añadir evento al timeline
    await addTimelineEvent(candidateId, {
      type: "stage_change",
      title: `Movido a ${newStage.name}`,
      description: `El candidato fue movido de "${currentStage.name}" a "${newStage.name}"`,
      author,
      date: new Date().toISOString(),
      icon: "ArrowRight",
    })
  }

  const addTimelineEvent = async (candidateId: number, event: Omit<TimelineEvent, "id" | "candidate_id">) => {
    if (!useSupabase) return

    const { error } = await supabase.from("timeline").insert([{ candidate_id: candidateId, ...event }])
    if (error) {
      console.error("Error adding timeline event:", error)
    }
  }

  const getCandidatesByStage = (stageId: number) => {
    return candidates.filter((candidate) => candidate.current_stage_id === stageId)
  }

  const getCandidate = (candidateId: number) => {
    return candidates.find((candidate) => candidate.id === candidateId)
  }

  const getNextStage = (currentStageId: number) => {
    const currentStage = stages.find((s) => s.id === currentStageId)
    if (!currentStage) return undefined
    return stages.find((s) => s.order === currentStage.order + 1)
  }

  const addCandidate = async (
    candidateData: Omit<Candidate, "id" | "comments" | "status" | "applied_date" | "last_updated">,
  ) => {
    if (!useSupabase) return

    const currentDate = new Date().toISOString().split("T")[0]
    const newCandidateData = {
      ...candidateData,
      applied_date: currentDate,
      last_updated: currentDate,
    }

    const { error } = await supabase.from("candidates").insert([newCandidateData])
    if (error) {
      console.error("Error adding candidate:", error)
    }
  }

  const rejectCandidate = async (candidateId: number, reason: string, author = "Usuario") => {
    if (!useSupabase) return

    const { error } = await supabase
      .from("candidates")
      .update({ status: "Rechazado", current_stage_id: -1 })
      .eq("id", candidateId)

    if (error) {
      console.error("Error rejecting candidate:", error)
      return
    }

    await addTimelineEvent(candidateId, {
      type: "movement",
      title: "Candidato rechazado",
      description: `Motivo: ${reason}`,
      author,
      date: new Date().toISOString(),
      icon: "X",
    })
  }

  const getRejectedCandidates = () => {
    return candidates.filter((candidate) => candidate.status === "Rechazado")
  }

  const getProcess = (processId: number) => {
    return processes.find(p => p.id === processId)
  }

  return (
    <RecruitmentContext.Provider
      value={{
        candidates,
        stages,
        processes,
        moveCandidateToStage,
        addTimelineEvent,
        getCandidatesByStage,
        getCandidate,
        getNextStage,
        addCandidate,
        rejectCandidate,
        getRejectedCandidates,
        getProcess: (id: number) => processes.find(p => p.id === id),
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
