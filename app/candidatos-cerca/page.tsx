"use client"

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useRecruitment } from '@/lib/recruitment-context'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Loading } from '@/components/ui/loading'
import withAuth from '@/components/withAuth'
import {
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Briefcase,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'

interface CandidateWithDetails {
  id: number
  name: string
  email: string
  applied_date: string
  last_updated: string
  status: string
  process: {
    id: number
    title: string
    stages: Array<{
      id: number
      name: string
      responsible: string | null
      order: number
    }>
  }
  currentStage: {
    id: number
    name: string
    responsible: string | null
    order: number
  }
  daysSinceUpdate: number
}

function CandidatosCercaPage() {
  const router = useRouter()
  const { candidates, stages, processes, loading } = useRecruitment()
  const { profile } = useAuth()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStages, setSelectedStages] = useState<number[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'lastUpdated'>('lastUpdated')
  const [showFilters, setShowFilters] = useState(false)

  // Obtener candidatos cercanos (donde el usuario es responsable de la etapa actual)
  const nearbyCandidates = useMemo(() => {
    if (!profile?.full_name) return []

    const candidatesWithDetails: CandidateWithDetails[] = candidates
      .filter(candidate => candidate.status === 'Activo')
      .map(candidate => {
        const process = processes.find(p => p.id === candidate.process_id)
        const processStages = stages.filter(s => s.process_id === candidate.process_id).sort((a, b) => a.order - b.order)
        const currentStage = stages.find(s => s.id === candidate.current_stage_id)
        
        if (!process || !currentStage) return null

        const daysSinceUpdate = Math.floor(
          (new Date().getTime() - new Date(candidate.last_updated).getTime()) / (1000 * 60 * 60 * 24)
        )

        return {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          applied_date: candidate.applied_date,
          last_updated: candidate.last_updated,
          status: candidate.status,
          process: {
            id: process.id,
            title: process.title,
            stages: processStages
          },
          currentStage,
          daysSinceUpdate
        }
      })
      .filter((candidate): candidate is CandidateWithDetails => 
        candidate !== null && 
        candidate.currentStage.responsible === profile.full_name
      )

    return candidatesWithDetails
  }, [candidates, stages, processes, profile?.full_name])

  // Filtrar candidatos
  const filteredCandidates = useMemo(() => {
    let filtered = nearbyCandidates

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(candidate =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.process.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por etapas seleccionadas
    if (selectedStages.length > 0) {
      filtered = filtered.filter(candidate =>
        selectedStages.includes(candidate.currentStage.id)
      )
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else {
        return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
      }
    })

    return filtered
  }, [nearbyCandidates, searchTerm, selectedStages, sortBy])

  // Obtener todas las etapas únicas donde el usuario es responsable
  const availableStages = useMemo(() => {
    if (!profile?.full_name) return []
    
    const userStages = stages.filter(stage => 
      stage.responsible === profile.full_name
    )
    
    // Eliminar duplicados por nombre
    const uniqueStages = userStages.filter((stage, index, self) =>
      index === self.findIndex(s => s.name === stage.name)
    )
    
    return uniqueStages
  }, [stages, profile?.full_name])

  const handleStageFilter = (stageId: number, checked: boolean) => {
    setSelectedStages(prev => 
      checked 
        ? [...prev, stageId]
        : prev.filter(id => id !== stageId)
    )
  }

  const handleCandidateClick = (candidateId: number) => {
    router.push(`/candidates/${candidateId}`)
  }

  if (loading) {
    return <Loading fullScreen text="Cargando candidatos cercanos..." size="lg" />
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
              <h1 className="text-2xl font-bold text-foreground">Candidatos cerca de ti</h1>
              <p className="text-muted-foreground">
                Candidatos en etapas donde eres responsable
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {filteredCandidates.length} candidatos
            </Badge>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros avanzados
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label htmlFor="search">Buscar candidato o proceso</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Buscar por nombre de candidato o proceso..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="w-48">
                  <Label htmlFor="sort">Ordenar por</Label>
                  <Select value={sortBy} onValueChange={(value: 'name' | 'lastUpdated') => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lastUpdated">Última actualización</SelectItem>
                      <SelectItem value="name">Nombre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-base font-medium">Filtrar por etapa</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                      {availableStages.map(stage => (
                        <div key={stage.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`stage-${stage.id}`}
                            checked={selectedStages.includes(stage.id)}
                            onCheckedChange={(checked) => 
                              handleStageFilter(stage.id, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={`stage-${stage.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {stage.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedStages.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStages([])}
                        className="mt-3"
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Candidates List */}
        {filteredCandidates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No hay candidatos cerca de ti
              </h3>
              <p className="text-muted-foreground">
                {nearbyCandidates.length === 0 
                  ? "No eres responsable de ninguna etapa actualmente."
                  : "No hay candidatos que coincidan con los filtros aplicados."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCandidates.map(candidate => (
              <Card 
                key={candidate.id}
                className="hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300"
                onClick={() => handleCandidateClick(candidate.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Main Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {candidate.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Briefcase className="h-4 w-4" />
                              <span>{candidate.process.title}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Actualizado {new Date(candidate.last_updated).toLocaleDateString('es-ES')}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Status Indicators */}
                        <div className="flex items-center space-x-2">
                          {candidate.daysSinceUpdate > 30 && (
                            <Badge variant="destructive" className="flex items-center space-x-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Detenido +30d</span>
                            </Badge>
                          )}
                          <Badge 
                            variant="secondary" 
                            className="bg-blue-100 text-blue-800"
                          >
                            {candidate.currentStage.name}
                          </Badge>
                        </div>
                      </div>

                      {/* Process Stages */}
                      <div className="mt-4">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Proceso de selección:
                        </Label>
                        <div className="flex items-center space-x-2 mt-2 overflow-x-auto">
                          {candidate.process.stages.map((stage, index) => (
                            <React.Fragment key={stage.id}>
                              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                                stage.id === candidate.currentStage.id
                                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300 font-medium'
                                  : stage.order < candidate.currentStage.order
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <span>{stage.name}</span>
                              </div>
                              {index < candidate.process.stages.length - 1 && (
                                <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Arrow */}
                    <div className="ml-4">
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(CandidatosCercaPage)
