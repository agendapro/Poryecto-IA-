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
  Crown,
  UserCheck,
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
    manager: string | null
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
  relevanceReason: 'manager' | 'responsible' | 'both'
}

function CandidatosCercaPage() {
  const router = useRouter()
  const { candidates, stages, processes, loading } = useRecruitment()
  const { profile } = useAuth()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStages, setSelectedStages] = useState<number[]>([])
  const [selectedRelevance, setSelectedRelevance] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'lastUpdated'>('lastUpdated')
  const [showFilters, setShowFilters] = useState(false)

  // Obtener candidatos cercanos (donde el usuario es manager del proceso o responsable de la etapa actual)
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

        // Determinar la razón de relevancia
        const isManager = process.manager === profile.full_name
        const isResponsible = currentStage.responsible === profile.full_name
        
        // Solo incluir si es manager o responsable
        if (!isManager && !isResponsible) return null

        let relevanceReason: 'manager' | 'responsible' | 'both'
        if (isManager && isResponsible) {
          relevanceReason = 'both'
        } else if (isManager) {
          relevanceReason = 'manager'
        } else {
          relevanceReason = 'responsible'
        }

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
            manager: process.manager,
            stages: processStages
          },
          currentStage,
          daysSinceUpdate,
          relevanceReason
        }
      })
      .filter((candidate): candidate is CandidateWithDetails => candidate !== null)

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

    // Filtro por tipo de relevancia
    if (selectedRelevance.length > 0) {
      filtered = filtered.filter(candidate =>
        selectedRelevance.includes(candidate.relevanceReason)
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
  }, [nearbyCandidates, searchTerm, selectedStages, selectedRelevance, sortBy])

  // Obtener todas las etapas únicas de los candidatos cercanos
  const availableStages = useMemo(() => {
    if (!profile?.full_name) return []
    
    // Obtener todas las etapas actuales de los candidatos cercanos
    const candidateStages = nearbyCandidates.map(candidate => candidate.currentStage)
    
    // Eliminar duplicados por nombre
    const uniqueStages = candidateStages.filter((stage, index, self) =>
      index === self.findIndex(s => s.name === stage.name)
    )
    
    return uniqueStages
  }, [nearbyCandidates, profile?.full_name])

  const handleStageFilter = (stageId: number, checked: boolean) => {
    setSelectedStages(prev => 
      checked 
        ? [...prev, stageId]
        : prev.filter(id => id !== stageId)
    )
  }

  const handleRelevanceFilter = (relevanceType: string, checked: boolean) => {
    setSelectedRelevance(prev => 
      checked 
        ? [...prev, relevanceType]
        : prev.filter(type => type !== relevanceType)
    )
  }

  const handleCandidateClick = (candidateId: number) => {
    router.push(`/candidates/${candidateId}?from=nearby`)
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
                Candidatos de procesos donde eres manager o estás a cargo de su etapa actual
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
                        Limpiar filtros de etapa
                      </Button>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="text-base font-medium">Filtrar por razón de relevancia</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="relevance-manager"
                          checked={selectedRelevance.includes('manager')}
                          onCheckedChange={(checked) => 
                            handleRelevanceFilter('manager', checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor="relevance-manager"
                          className="text-sm font-normal cursor-pointer flex items-center space-x-1"
                        >
                          <Crown className="h-3 w-3 text-purple-600" />
                          <span>Soy manager del proceso</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="relevance-responsible"
                          checked={selectedRelevance.includes('responsible')}
                          onCheckedChange={(checked) => 
                            handleRelevanceFilter('responsible', checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor="relevance-responsible"
                          className="text-sm font-normal cursor-pointer flex items-center space-x-1"
                        >
                          <UserCheck className="h-3 w-3 text-blue-600" />
                          <span>Soy responsable de la etapa</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="relevance-both"
                          checked={selectedRelevance.includes('both')}
                          onCheckedChange={(checked) => 
                            handleRelevanceFilter('both', checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor="relevance-both"
                          className="text-sm font-normal cursor-pointer flex items-center space-x-1"
                        >
                          <Crown className="h-3 w-3 text-green-600" />
                          <UserCheck className="h-3 w-3 text-green-600" />
                          <span>Ambos</span>
                        </Label>
                      </div>
                    </div>
                    {selectedRelevance.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRelevance([])}
                        className="mt-3"
                      >
                        Limpiar filtros de relevancia
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
                  ? "No eres manager de ningún proceso ni responsable de ninguna etapa actualmente."
                  : "No hay candidatos que coincidan con los filtros aplicados."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCandidates.map(candidate => (
              <Card 
                key={candidate.id}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300 hover:-translate-y-1"
                onClick={() => handleCandidateClick(candidate.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Candidate Name */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
                        {candidate.name}
                      </h3>
                      {/* Relevance Indicator */}
                      <div className="flex items-center space-x-1">
                        {candidate.relevanceReason === 'manager' && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            <Crown className="h-3 w-3 mr-1" />
                            Eres el manager
                          </Badge>
                        )}
                        {candidate.relevanceReason === 'responsible' && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Eres responsable de la etapa
                          </Badge>
                        )}
                        {candidate.relevanceReason === 'both' && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <Crown className="h-3 w-3 mr-1" />
                            <UserCheck className="h-3 w-3 mr-1" />
                            Manager y responsable
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Process Name */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Briefcase className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{candidate.process.title}</span>
                      </div>
                    </div>

                    {/* Process Stages - Todas con actual destacada */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Progreso del proceso:
                      </Label>
                      <div className="space-y-2">
                        {candidate.process.stages.map((stage, index) => (
                          <div key={stage.id} className="flex items-center space-x-2">
                            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                              stage.id === candidate.currentStage.id
                                ? 'bg-blue-600 text-white'
                                : stage.order < candidate.currentStage.order
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {stage.order}
                            </div>
                            <div className={`flex-1 px-2 py-1 rounded text-xs flex items-center justify-between ${
                              stage.id === candidate.currentStage.id
                                ? 'bg-blue-100 text-blue-800 border border-blue-300 font-medium'
                                : stage.order < candidate.currentStage.order
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <span>{stage.name}</span>
                              {stage.responsible === profile?.full_name && (
                                <UserCheck className="h-3 w-3 text-blue-600 flex-shrink-0" title="Eres responsable de esta etapa" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status and Date */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      {candidate.daysSinceUpdate > 30 && (
                        <Badge variant="destructive" className="flex items-center justify-center space-x-1 w-full">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Detenido +30d</span>
                        </Badge>
                      )}
                      
                      <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Actualizado {new Date(candidate.last_updated).toLocaleDateString('es-ES')}</span>
                      </div>
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
