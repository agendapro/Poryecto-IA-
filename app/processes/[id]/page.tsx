"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  MessageSquare,
  MapPin,
  Edit,
  Upload,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import withAuth from "@/components/withAuth"
import { useParams } from "react-router-dom"
import { useRouter } from "next/navigation"

export default function ProcessDetail() {
  const { stages, processes, getProcess, getCandidatesByStage, moveCandidateToStage, addCandidate, rejectCandidate, getRejectedCandidates, getCandidate } = useRecruitment()
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const [draggedCandidate, setDraggedCandidate] = useState<number | null>(null)
  const router = useRouter()
  const { id } = useParams()
  const processId = Number(id)
  const process = getProcess(processId)

  if (!process) {
    return <div className="p-6">Proceso no encontrado</div>
  }

  const handleAddCandidate = (stageId: number) => {
    setSelectedStage(stageId)
    setIsAddCandidateOpen(true)
  }

  const handleSubmitCandidate = () => {
    if (candidateForm.name && candidateForm.email && candidateForm.origen && selectedStage) {
      addCandidate({
        ...candidateForm,
        current_stage_id: selectedStage,
      })

      // Reset form and close dialog
      setCandidateForm({
        name: "",
        email: "",
        phone: "",
        location: "",
        origen: "",
        cv: null,
      })
      setIsAddCandidateOpen(false)
      setSelectedStage(null)
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetStageId: number) => {
    e.preventDefault()
    if (draggedCandidate) {
      const candidate = getCandidate(draggedCandidate)
      if (candidate && candidate.currentStageId !== targetStageId) {
        moveCandidateToStage(draggedCandidate, targetStageId, "Ana García")
      }
    }
    setDraggedCandidate(null)
  }

  const handleDragEnd = () => {
    setDraggedCandidate(null)
  }

  const handleRejectCandidate = (candidateId: number) => {
    setCandidateToReject(candidateId)
    setRejectReason("")
  }

  const confirmRejectCandidate = () => {
    if (candidateToReject && rejectReason.trim()) {
      rejectCandidate(candidateToReject, rejectReason, "Ana García")
      setCandidateToReject(null)
      setRejectReason("")
    }
  }

  const getDaysSinceUpdate = (lastUpdated: string) => {
    const lastUpdatedDate = new Date(lastUpdated)
    const now = new Date()
    const diffTime = now.getTime() - lastUpdatedDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const [candidateForm, setCandidateForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    origen: "",
    cv: null as File | null,
  })

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
            <Button variant="outline">
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
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
              {stages.map((stage) => {
                const stageCandidates = getCandidatesByStage(stage.id)
                return (
                  <div
                    key={stage.id}
                    className="bg-muted/50 rounded-lg p-4 min-h-[400px]"
                    onDragOver={handleDragOver}
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
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-medium text-sm text-foreground">{candidate.name}</h4>
                                  <p className="text-xs text-muted-foreground">{candidate.email}</p>
                                </div>
                              </div>

                              <div className="flex items-end justify-between text-xs text-muted-foreground mt-4">
                                <div className="space-y-1">
                                  <div>Creado: {new Date(candidate.applied_date).toLocaleDateString("es-ES")}</div>
                                  <div>Actualizado: {new Date(candidate.last_updated).toLocaleDateString("es-ES")}</div>
                                </div>

                                {daysSinceUpdate > 30 && (
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
                                )}
                              </div>
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-2">
                                <MessageSquare className="h-3 w-3" />
                                <span>{candidate.comments}</span>
                              </div>
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

        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setIsRejectedExpanded(!isRejectedExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-red-600">Rechazados</CardTitle>
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  {getRejectedCandidates().length} candidatos
                </Badge>
              </div>
              {isRejectedExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <CardDescription>Candidatos que han sido rechazados del proceso</CardDescription>
          </CardHeader>

          {isRejectedExpanded && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getRejectedCandidates().map((candidate) => (
                  <Card key={candidate.id} className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`/placeholder-32px.png?height=32&width=32`} />
                            <AvatarFallback>
                              {candidate.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-sm text-foreground">{candidate.name}</h4>
                            <p className="text-xs text-muted-foreground">{candidate.email}</p>
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          Rechazado
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{candidate.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{candidate.comments}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        Aplicó: {new Date(candidate.applied_date).toLocaleDateString("es-ES")}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {getRejectedCandidates().length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No hay candidatos rechazados
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
                  Se agregará a: {stages.find((s) => s.id === selectedStage)?.name}
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
              disabled={!candidateForm.name || !candidateForm.email || !candidateForm.origen}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 dark:from-purple-500 dark:to-blue-500 dark:hover:from-purple-600 dark:hover:to-blue-600"
            >
              Agregar Candidato
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
