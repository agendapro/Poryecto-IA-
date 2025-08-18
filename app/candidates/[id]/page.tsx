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
} from "lucide-react"
import { useRecruitment, type TimelineEvent } from "@/lib/recruitment-context"
import { createClient } from "@/lib/supabase/client"
import withAuth from "@/components/withAuth"

function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const candidateId = Number.parseInt(id)

  const { getCandidate, getNextStage, moveCandidateToStage, addTimelineEvent, stages, rejectCandidate } =
    useRecruitment()
  const candidate = getCandidate(candidateId)

  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [newComment, setNewComment] = useState("")
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    const supabase = createClient()
    const fetchTimeline = async () => {
      if (!candidate) return
      const { data, error } = await supabase
        .from("timeline")
        .select("*")
        .eq("candidate_id", candidate.id)
        .order("date", { ascending: false })

      if (error) {
        console.error("Error fetching timeline:", error)
      } else {
        setTimeline(data || [])
      }
    }

    fetchTimeline()
  }, [candidate])

  if (!candidate) {
    return <div>Cargando candidato...</div>
  }

  const currentStage = stages.find((s) => s.id === candidate.current_stage_id)
  const nextStage = getNextStage(candidate.current_stage_id)

  const handleMoveToNextStage = () => {
    if (nextStage) {
      moveCandidateToStage(candidate.id, nextStage.id, "Ana García")
    }
  }

  const handleAddComment = async () => {
    if (newComment.trim()) {
      await addTimelineEvent(candidate.id, {
        type: "comment",
        title: "Nuevo comentario",
        description: newComment,
        author: "Ana García",
        date: new Date().toISOString(),
        icon: "MessageCircle",
      })
      // Volver a cargar el timeline para mostrar el nuevo comentario
      const supabase = createClient()
      const { data } = await supabase
        .from("timeline")
        .select("*")
        .eq("candidate_id", candidate.id)
        .order("date", { ascending: false })
      setTimeline(data || [])
      setNewComment("")
    }
  }

  const handleRejectCandidate = () => {
    if (rejectReason.trim()) {
      rejectCandidate(candidate.id, rejectReason, "Ana García")
      setIsRejectModalOpen(false)
      setRejectReason("")
      // Redirect back to process view
      window.location.href = "/processes/1"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => (window.location.href = "/processes/1")}>
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
                <p className="text-muted-foreground">Desarrollador Frontend Senior</p>
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

                {/* Upload Area */}
                <div className="mt-4 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Arrastra archivos aquí o</p>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Seleccionar archivos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row - Comments Section (Full Width) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <CardTitle>Comentarios</CardTitle>
                  <span className="text-sm text-muted-foreground">{timeline.length} eventos en el timeline</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((event) => (
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
                        <span className="text-sm text-muted-foreground">{event.title}</span>
                      </div>

                      {event.description && <div className="text-sm text-foreground">{event.description}</div>}
                    </div>

                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Add Comment Input */}
                <div className="flex space-x-3 pt-4 border-t">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                      AG
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
