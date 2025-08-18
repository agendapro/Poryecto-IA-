"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  ArrowLeft,
  FileText,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Download,
  Plus,
  Send,
  MoreHorizontal,
  X,
  Eye,
  EyeOff,
  Upload,
} from "lucide-react"
import { useRecruitment, type TimelineEvent } from "@/lib/recruitment-context"
import { useAuth } from "@/lib/auth-context"
import { Loading } from "@/components/ui/loading"
import { createClient } from "@/lib/supabase/client"
import withAuth from "@/components/withAuth"

function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const candidateId = Number.parseInt(id)

  const { getCandidate, getNextStage, moveCandidateToStage, addTimelineEvent, stages, rejectCandidate, getProcess, getStagesByProcess, loading, uploadCV, downloadCV, updateCandidateCV } =
    useRecruitment()
  const { profile } = useAuth()
  const candidate = getCandidate(candidateId)
  const process = candidate ? getProcess(candidate.process_id) : null
  const processStages = candidate ? getStagesByProcess(candidate.process_id) : []

  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [newComment, setNewComment] = useState("")
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [showAllComments, setShowAllComments] = useState(false)
  const [visibleComments, setVisibleComments] = useState<Set<number>>(new Set())
  const [isUploadingCV, setIsUploadingCV] = useState(false)

  const fetchTimeline = async () => {
    if (!candidate) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from("timeline")
      .select("*")
      .eq("candidate_id", candidate.id)
      .order("date", { ascending: true })

    if (error) {
      console.error("Error fetching timeline:", error)
    } else {
      setTimeline(data || [])
    }
  }

  useEffect(() => {
    if (candidate) {
      fetchTimeline()
    }
  }, [candidate])

  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return <Loading fullScreen text="Cargando candidato..." size="lg" />
  }

  // Solo mostrar "no encontrado" si ya terminó de cargar y realmente no existe
  if (!candidate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Candidato no encontrado</h1>
          <p className="text-muted-foreground">El candidato que buscas no existe o ha sido eliminado.</p>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    )
  }

  const currentStage = processStages.find((s) => s.id === candidate.current_stage_id)
  const nextStage = processStages.find((s) => s.order === (currentStage?.order ?? 0) + 1)

  const handleMoveToNextStage = async () => {
    if (nextStage) {
      try {
        await moveCandidateToStage(candidate.id, nextStage.id, profile?.full_name || "Usuario")
        // Recargar timeline
        await fetchTimeline()
      } catch (error) {
        console.error('Error moving candidate:', error)
        alert("Error al mover candidato. Por favor, intenta de nuevo.")
      }
    }
  }

  const handleAddComment = async () => {
    if (newComment.trim()) {
      try {
        await addTimelineEvent(candidate.id, {
          type: "comment",
          title: "",
          description: newComment,
          author: profile?.full_name || "Usuario",
          date: new Date().toISOString(),
          icon: "MessageCircle",
        })
        // Volver a cargar el timeline para mostrar el nuevo comentario
        await fetchTimeline()
        setNewComment("")
      } catch (error) {
        console.error('Error adding comment:', error)
        alert("Error al agregar comentario. Por favor, intenta de nuevo.")
      }
    }
  }

  const handleRejectCandidate = async () => {
    if (rejectReason.trim()) {
      try {
        await rejectCandidate(candidate.id, rejectReason, profile?.full_name || "Usuario")
        setIsRejectModalOpen(false)
        setRejectReason("")
        alert("Candidato rechazado exitosamente")
        // Redirect back to process view
        window.location.href = `/processes/${candidate.process_id}`
      } catch (error) {
        console.error('Error rejecting candidate:', error)
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        alert(`Error al rechazar candidato: ${errorMessage}`)
      }
    }
  }

  const toggleCommentVisibility = (commentId: number) => {
    setVisibleComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  const toggleAllComments = () => {
    if (showAllComments) {
      setVisibleComments(new Set())
      setShowAllComments(false)
    } else {
      const allCommentIds = timeline.filter(event => event.type === "comment").map(event => event.id)
      setVisibleComments(new Set(allCommentIds))
      setShowAllComments(true)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      alert("Por favor, selecciona un archivo PDF válido")
      e.target.value = ""
      return
    }

    setIsUploadingCV(true)
    try {
      const cvUrl = await uploadCV(file)
      await updateCandidateCV(candidateId, cvUrl)
      
      // Añadir evento al timeline
      await addTimelineEvent(candidateId, {
        type: "movement",
        title: "",
        description: `CV actualizado: ${file.name}`,
        author: profile?.full_name || "Usuario",
        date: new Date().toISOString(),
        icon: "FileText",
      })

      alert("CV subido exitosamente!")
      await fetchTimeline() // Refrescar timeline
    } catch (error) {
      console.error("Error uploading CV:", error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert(`Error al subir CV: ${errorMessage}`)
    } finally {
      setIsUploadingCV(false)
      e.target.value = ""
    }
  }

  const handleDownloadCV = () => {
    if (candidate?.cv) {
      downloadCV(candidate.cv)
    } else {
      alert("No hay CV disponible para descargar")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => (window.location.href = `/processes/${candidate.process_id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al proceso
            </Button>
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/placeholder.svg?height=48&width=48" />
                <AvatarFallback>
                  {candidate.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{candidate.name}</h1>
                <p className="text-muted-foreground">{process?.title || "Candidato"}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
                  <X className="h-4 w-4 mr-2" />
                  Rechazado
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Rechazar Candidato</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    ¿Estás seguro de que quieres rechazar a {candidate.name}? Por favor, proporciona un motivo.
                  </p>
                  <Textarea
                    placeholder="Motivo del rechazo..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleRejectCandidate} disabled={!rejectReason.trim()}>
                      Rechazar Candidato
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              onClick={handleMoveToNextStage}
              disabled={!nextStage}
            >
              {nextStage ? `Mover a ${nextStage.name}` : "Proceso completado"}
            </Button>
            <Badge className="bg-green-100 text-green-800">{candidate.status}</Badge>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="space-y-6">
          {/* Top Row - Personal Info & Documents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left - Candidate Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{candidate.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{candidate.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{candidate.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    Aplicó: {new Date(candidate.applied_date).toLocaleDateString("es-ES")}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Right - Documents */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Documentos</CardTitle>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Subir
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Document rendering logic will go here */}
                </div>

                {/* CV Section */}
                <div className="mt-4">
                  {candidate?.cv ? (
                    <div className="border border-muted-foreground/25 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="font-medium">CV del candidato</p>
                            <p className="text-sm text-muted-foreground">Archivo PDF disponible</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={handleDownloadCV}>
                            <Download className="h-4 w-4 mr-2" />
                            Ver/Descargar
                          </Button>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="cv-upload-replace"
                            disabled={isUploadingCV}
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => document.getElementById("cv-upload-replace")?.click()}
                            disabled={isUploadingCV}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {isUploadingCV ? "Subiendo..." : "Reemplazar"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">No hay CV subido</p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="cv-upload-new"
                        disabled={isUploadingCV}
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => document.getElementById("cv-upload-new")?.click()}
                        disabled={isUploadingCV}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {isUploadingCV ? "Subiendo..." : "Subir CV (PDF)"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row - Comments Section (Full Width) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Título eliminado como solicitó el usuario */}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllComments}
                  className="flex items-center space-x-2"
                >
                  {showAllComments ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>{showAllComments ? "Ocultar todos los comentarios" : "Mostrar todos los comentarios"}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((event) => {
                  const isComment = event.type === "comment"
                  const isVisible = !isComment || visibleComments.has(event.id)
                  
                  return (
                    <div key={event.id} className="flex space-x-3 group">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground mb-2">
                          {new Date(event.date).toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
                        </span>
                      </div>

                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-sm font-semibold">
                          {event.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-foreground">{event.author}</span>
                          {event.title && <span className="text-sm text-muted-foreground">{event.title}</span>}
                        </div>

                        {isComment ? (
                          <div className="flex items-center space-x-2">
                            {isVisible ? (
                              <div className="text-sm text-foreground">{event.description}</div>
                            ) : (
                              <div className="text-sm text-muted-foreground italic">Comentario oculto</div>
                            )}
                          </div>
                        ) : (
                          event.description && <div className="text-sm text-foreground">{event.description}</div>
                        )}
                      </div>

                      {isComment ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleCommentVisibility(event.id)}
                          className="ml-2"
                        >
                          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="ml-2 opacity-30">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}

                {/* Add Comment Input */}
                <div className="flex space-x-3 pt-4 border-t">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-sm font-semibold">
                      {profile?.full_name
                        ? profile.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Add a comment here..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] resize-none border-0 bg-muted/50 focus:bg-background"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        onClick={handleAddComment}
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Comentar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default withAuth(CandidateDetailPage)
