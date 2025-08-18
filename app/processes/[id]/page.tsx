"use client"

import type React from "react"

import { useState, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Plus,
  Edit,
  Upload,
  FileText,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Loading } from "@/components/ui/loading"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRecruitment } from "@/lib/recruitment-context"
import { useAuth } from "@/lib/auth-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import withAuth from "@/components/withAuth"
import { useRouter } from "next/navigation"

function ProcessDetail({ params }: { params: Promise<{ id: string }> }) {
  const { stages, processes, getProcess, getCandidatesByStage, moveCandidateToStage, addCandidate, rejectCandidate, getRejectedCandidates, getRejectedCandidatesByProcess, getCandidate, getStagesByProcess, loading, uploadCV } = useRecruitment()
  const { profile } = useAuth()
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const [draggedCandidate, setDraggedCandidate] = useState<number | null>(null)
  const [candidateToReject, setCandidateToReject] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [isRejectedExpanded, setIsRejectedExpanded] = useState(false)
  const [isAddingCandidate, setIsAddingCandidate] = useState(false)
  const [dragOverStage, setDragOverStage] = useState<number | null>(null)
  const [dragOverReject, setDragOverReject] = useState(false)
  const [candidateForm, setCandidateForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    origen: "",
    cv: undefined as File | undefined,
  })
  
  const router = useRouter()
  const { id } = use(params)
  const processId = Number(id)
  const process = getProcess(processId)
  const processStages = getStagesByProcess(processId)

  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return <Loading fullScreen text="Cargando proceso..." size="lg" />
  }

  // Solo mostrar "no encontrado" si ya terminó de cargar y realmente no existe
  if (!process) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Proceso no encontrado</h1>
          <p className="text-muted-foreground">El proceso que buscas no existe o ha sido eliminado.</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const handleAddCandidate = (stageId: number) => {
    setSelectedStage(stageId)
    setIsAddCandidateOpen(true)
  }

  const handleSubmitCandidate = async () => {
    if (candidateForm.name && candidateForm.email && candidateForm.origen && selectedStage) {
      setIsAddingCandidate(true)
      try {
        await addCandidate({
          name: candidateForm.name,
          email: candidateForm.email,
          phone: candidateForm.phone,
          location: candidateForm.location,
          origen: candidateForm.origen,
          cv: undefined, // La URL se generará automáticamente
          cvFile: candidateForm.cv, // Pasamos el archivo para que se suba
          process_id: processId,
          current_stage_id: selectedStage,
        })

        // Reset form and close dialog
        setCandidateForm({
          name: "",
          email: "",
          phone: "",
          location: "",
          origen: "",
          cv: undefined,
        })
        setIsAddCandidateOpen(false)
        setSelectedStage(null)
        
        // Mostrar mensaje de éxito
        alert("¡Candidato agregado exitosamente!")
      } catch (error) {
        console.error('Error adding candidate:', error)
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        alert(`Error al agregar candidato: ${errorMessage}`)
      } finally {
        setIsAddingCandidate(false)
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setCandidateForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setCandidateForm((prev) => ({
        ...prev,
        cv: file,
      }))
    } else if (file) {
      alert("Por favor, selecciona un archivo PDF válido")
      e.target.value = ""
    }
  }

  const handleCandidateClick = (candidateId: number) => {
    window.location.href = `/candidates/${candidateId}`
  }

  const handleDragStart = (e: React.DragEvent, candidateId: number) => {
    setDraggedCandidate(candidateId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, stageId: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverStage(stageId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Solo limpiar si realmente salimos del contenedor
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverStage(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetStageId: number) => {
    e.preventDefault()
    if (draggedCandidate) {
      const candidate = getCandidate(draggedCandidate)
      if (candidate && (candidate.current_stage_id !== targetStageId || candidate.status === "Rechazado")) {
        try {
          await moveCandidateToStage(draggedCandidate, targetStageId, profile?.full_name || "Usuario")
          
          // Mostrar mensaje específico si se reactivó un candidato rechazado
          if (candidate.status === "Rechazado") {
            alert("Candidato reactivado y movido exitosamente")
          }
        } catch (error) {
          console.error('Error moving candidate:', error)
          alert("Error al mover candidato. Por favor, intenta de nuevo.")
        }
      }
    }
    setDraggedCandidate(null)
    setDragOverStage(null)
  }

  const handleRejectDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverReject(true)
  }

  const handleRejectDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverReject(false)
    }
  }

  const handleRejectDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedCandidate) {
      const candidate = getCandidate(draggedCandidate)
      if (candidate && candidate.status !== "Rechazado") {
        // Abrir diálogo para obtener motivo del rechazo
        setCandidateToReject(draggedCandidate)
        setRejectReason("")
      }
    }
    setDraggedCandidate(null)
    setDragOverReject(false)
  }

  const handleDragEnd = () => {
    setDraggedCandidate(null)
    setDragOverStage(null)
    setDragOverReject(false)
  }

  const handleRejectCandidate = (candidateId: number) => {
    setCandidateToReject(candidateId)
    setRejectReason("")
  }

  const confirmRejectCandidate = async () => {
    if (candidateToReject && rejectReason.trim()) {
      try {
        await rejectCandidate(candidateToReject, rejectReason, profile?.full_name || "Usuario")
        setCandidateToReject(null)
        setRejectReason("")
        alert("Candidato rechazado exitosamente")
      } catch (error) {
        console.error('Error rejecting candidate:', error)
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        alert(`Error al rechazar candidato: ${errorMessage}`)
      }
    }
  }

  const getDaysSinceUpdate = (lastUpdated: string) => {
    const lastUpdatedDate = new Date(lastUpdated)
    const now = new Date()
    const diffTime = now.getTime() - lastUpdatedDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }



  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{process.title}</h1>
              <p className="text-muted-foreground">Manager: {process.manager}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge className="bg-green-100 text-green-800">
              {process.status}
            </Badge>
            <Button variant="outline" onClick={() => router.push(`/processes/${processId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </header>

      {/* Process Info */}
      <div className="p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información del Proceso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-2">Descripción</h4>
                <p className="text-muted-foreground text-sm">{process.description}</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Rango Salarial</h4>
                <p className="text-muted-foreground text-sm">{process.salary_range}</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Fecha de Creación</h4>
                <p className="text-muted-foreground text-sm">
                  {new Date(process.created_at).toLocaleDateString("es-ES")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pipeline de Candidatos</CardTitle>
            <CardDescription>Arrastra y suelta candidatos entre etapas para actualizar su estado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {processStages.map((stage) => {
                const stageCandidates = getCandidatesByStage(stage.id)
                return (
                  <div
                    key={stage.id}
                    className={`bg-muted/50 rounded-lg p-4 min-h-[400px] transition-all duration-200 ${
                      dragOverStage === stage.id 
                        ? 'bg-blue-50 border-2 border-blue-300 border-dashed scale-105' 
                        : 'border-2 border-transparent'
                    }`}
                    onDragOver={(e) => handleDragOver(e, stage.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{stage.name}</h3>
                        <Badge variant="secondary">{stageCandidates.length}</Badge>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleAddCandidate(stage.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {stageCandidates.map((candidate) => {
                        const daysSinceUpdate = getDaysSinceUpdate(candidate.last_updated)
                        return (
                          <Card
                            key={candidate.id}
                            className={`cursor-pointer hover:shadow-md transition-all bg-card ${
                              draggedCandidate === candidate.id ? "opacity-50 scale-95" : ""
                            }`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, candidate.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleCandidateClick(candidate.id)}
                          >
                            <CardContent className="p-3">
                              <div className="mb-3">
                                <h4 className="font-medium text-sm text-foreground">{candidate.name}</h4>
                              </div>

                              <div className="space-y-1 text-xs text-muted-foreground">
                                <div>Creado: {new Date(candidate.applied_date).toLocaleDateString("es-ES")}</div>
                                <div>Actualizado: {new Date(candidate.last_updated).toLocaleDateString("es-ES")}</div>
                              </div>

                              {daysSinceUpdate > 30 && (
                                <div className="mt-3 flex justify-end">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge variant="destructive" className="flex items-center gap-1 cursor-help">
                                          <Clock className="h-3 w-3" />
                                          <span>+30d</span>
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Más de 30 días sin movimiento</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sección Rechazados - Lista Desplegable y Zona de Drop Unificada */}
        <Card 
          className={`transition-all duration-200 ${
            dragOverReject 
              ? 'border-red-500 bg-red-50 scale-[1.02] shadow-lg' 
              : 'border-red-200'
          }`}
          onDragOver={handleRejectDragOver}
          onDragLeave={handleRejectDragLeave}
          onDrop={handleRejectDrop}
        >
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setIsRejectedExpanded(!isRejectedExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-red-600">Rechazados</CardTitle>
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  {getRejectedCandidatesByProcess(processId).length} candidatos
                </Badge>
              </div>
              {isRejectedExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <CardDescription>
              {draggedCandidate ? (
                <span className="text-red-600 font-medium">
                  ⬇ Suelta aquí para rechazar candidato
                </span>
              ) : (
                "Candidatos que han sido rechazados del proceso"
              )}
            </CardDescription>
          </CardHeader>

          {isRejectedExpanded && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getRejectedCandidatesByProcess(processId).map((candidate) => {
                  const daysSinceUpdate = getDaysSinceUpdate(candidate.last_updated)
                  return (
                    <Card 
                      key={candidate.id} 
                      className={`bg-red-50 border-red-200 cursor-pointer hover:shadow-md transition-all ${
                        draggedCandidate === candidate.id ? "opacity-50 scale-95" : ""
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, candidate.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleCandidateClick(candidate.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-sm text-foreground">{candidate.name}</h4>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            Rechazado
                          </Badge>
                        </div>

                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>Creado: {new Date(candidate.applied_date).toLocaleDateString("es-ES")}</div>
                          <div>Actualizado: {new Date(candidate.last_updated).toLocaleDateString("es-ES")}</div>
                        </div>

                        {daysSinceUpdate > 30 && (
                          <div className="mt-3 flex justify-end">
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>+30d</span>
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}

                {getRejectedCandidatesByProcess(processId).length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <X className="h-12 w-12 text-red-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">No hay candidatos rechazados</p>
                    <p className="text-sm">Arrastra candidatos aquí para rechazarlos</p>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

      </div>

      {/* Add Candidate Dialog */}
      <Dialog open={isAddCandidateOpen} onOpenChange={setIsAddCandidateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Candidato</DialogTitle>
            <DialogDescription>
              Completa la información del nuevo candidato
              {selectedStage && (
                <span className="block mt-1 text-sm font-medium text-purple-600 dark:text-purple-400">
                  Se agregará a: {processStages.find((s) => s.id === selectedStage)?.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                className="col-span-3"
                value={candidateForm.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                className="col-span-3"
                value={candidateForm.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Teléfono
              </Label>
              <Input
                id="phone"
                className="col-span-3"
                value={candidateForm.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+34 123 456 789"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Ubicación
              </Label>
              <Input
                id="location"
                className="col-span-3"
                value={candidateForm.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Ciudad, País"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="origen" className="text-right">
                Origen
              </Label>
              <Select value={candidateForm.origen} onValueChange={(value) => handleInputChange("origen", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona el origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Indeed">Indeed</SelectItem>
                  <SelectItem value="Web">Página Web</SelectItem>
                  <SelectItem value="Referido">Referido</SelectItem>
                  <SelectItem value="InfoJobs">InfoJobs</SelectItem>
                  <SelectItem value="Glassdoor">Glassdoor</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cv" className="text-right">
                CV
              </Label>
              <div className="col-span-3">
                <div className="flex items-center space-x-2">
                  <Input id="cv" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("cv")?.click()}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Subir CV (PDF)</span>
                  </Button>
                  {candidateForm.cv && (
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{candidateForm.cv.name}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Solo archivos PDF (máx. 5MB)</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCandidateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitCandidate}
              disabled={!candidateForm.name || !candidateForm.email || !candidateForm.origen || isAddingCandidate}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 dark:from-purple-500 dark:to-blue-500 dark:hover:from-purple-600 dark:hover:to-blue-600"
            >
              {isAddingCandidate ? "Agregando..." : "Agregar Candidato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={candidateToReject !== null} onOpenChange={() => setCandidateToReject(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <X className="h-5 w-5 text-red-600" />
              <span>Rechazar Candidato</span>
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres rechazar a este candidato? Esta acción se registrará en el timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="text-sm font-medium">
              Motivo del rechazo
            </Label>
            <Input
              id="reason"
              className="mt-2"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej: No cumple con los requisitos técnicos"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCandidateToReject(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmRejectCandidate} disabled={!rejectReason.trim()}>
              Rechazar Candidato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withAuth(ProcessDetail)
