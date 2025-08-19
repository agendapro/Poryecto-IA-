"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, GripVertical, User } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRecruitment } from "@/lib/recruitment-context"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface User {
  id: string
  full_name: string
  role: string
}

interface Stage {
  id: string
  name: string
  responsibleId: string
  responsibleName: string
}

// Componente sortable para cada etapa
function SortableStage({ 
  stage, 
  index, 
  users, 
  onStageChange, 
  onRemoveStage, 
  canRemove 
}: {
  stage: Stage
  index: number
  users: User[]
  onStageChange: (stageId: string, field: string, value: string) => void
  onRemoveStage: (stageId: string) => void
  canRemove: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isApplicationStage = stage.name === "Aplicación"

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center space-x-4 p-4 bg-muted rounded-lg ${isDragging ? 'z-50' : ''}`}
    >
      <div className="flex items-center space-x-2">
        <div 
          {...attributes} 
          {...listeners}
          className={`cursor-grab hover:cursor-grabbing ${isApplicationStage ? 'cursor-not-allowed opacity-50' : ''}`}
          style={isApplicationStage ? { pointerEvents: 'none' } : {}}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <Badge variant="secondary">{index + 1}</Badge>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm">Nombre de la Etapa</Label>
          <Input
            placeholder="ej. Entrevista Técnica"
            value={stage.name}
            onChange={(e) => onStageChange(stage.id, "name", e.target.value)}
            disabled={isApplicationStage}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Responsable</Label>
          {isApplicationStage ? (
            <div className="flex items-center space-x-2 px-3 py-2 bg-secondary rounded-md">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sistema</span>
            </div>
          ) : (
            <Select onValueChange={(value) => onStageChange(stage.id, "responsibleId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar responsable" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex flex-col">
                      <span>{user.full_name}</span>
                      <span className="text-xs text-muted-foreground">{user.role}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {canRemove && !isApplicationStage && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemoveStage(stage.id)}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default function NewProcess() {
  const { createProcess } = useRecruitment()
  const { user } = useAuth()
  const supabase = createClient()
  
  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    position: "",
    description: "",
    details: "",
    salaryMin: "",
    salaryMax: "",
    managerId: "",
    managerName: "",
  })

  const [stages, setStages] = useState<Stage[]>([
    { id: "1", name: "Aplicación", responsibleId: "", responsibleName: "Sistema" },
    { id: "2", name: "Revisión CV", responsibleId: "", responsibleName: "" },
    { id: "3", name: "Entrevista Técnica", responsibleId: "", responsibleName: "" },
    { id: "4", name: "Entrevista Final", responsibleId: "", responsibleName: "" },
  ])

  // Cargar usuarios desde Supabase
  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .order('full_name')

        if (error) {
          console.error('Error fetching users:', error)
          return
        }

        setUsers(data || [])
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchUsers()
  }, [supabase])

  // Filtrar usuarios que pueden ser managers (Administrador, Manager, Reclutador)
  const managers = users.filter(user => 
    ['Administrador', 'Manager', 'Reclutador'].includes(user.role)
  )

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleManagerSelect = (managerId: string) => {
    const manager = managers.find((m) => m.id === managerId)
    setFormData((prev) => ({
      ...prev,
      managerId,
      managerName: manager?.full_name || "",
    }))
  }

  const handleStageChange = (stageId: string, field: string, value: string) => {
    setStages((prev) =>
      prev.map((stage) => {
        if (stage.id === stageId) {
          if (field === "responsibleId") {
            const user = users.find((u) => u.id === value)
            return {
              ...stage,
              responsibleId: value,
              responsibleName: user?.full_name || "",
            }
          }
          return { ...stage, [field]: value }
        }
        return stage
      }),
    )
  }

  const addStage = () => {
    const newStage: Stage = {
      id: Date.now().toString(),
      name: "",
      responsibleId: "",
      responsibleName: "",
    }
    setStages((prev) => [...prev, newStage])
  }

  const removeStage = (stageId: string) => {
    if (stages.length > 1) {
      setStages((prev) => prev.filter((stage) => stage.id !== stageId))
    }
  }

  // Manejar el evento de drag end para reordenar etapas
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setStages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)
        
        // Prevenir mover la etapa "Aplicación" desde la primera posición
        if (oldIndex === 0 && items[0].name === "Aplicación") {
          return items
        }
        
        // Prevenir mover otras etapas a la primera posición si "Aplicación" está ahí
        if (newIndex === 0 && items[0].name === "Aplicación") {
          return items
        }

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.position || !formData.description || !formData.managerId) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    setLoading(true)

    try {
      // Construir rango salarial
      let salaryRange = ""
      if (formData.salaryMin || formData.salaryMax) {
        if (formData.salaryMin && formData.salaryMax) {
          salaryRange = `$${formData.salaryMin} - $${formData.salaryMax}`
        } else if (formData.salaryMin) {
          salaryRange = `Desde $${formData.salaryMin}`
        } else if (formData.salaryMax) {
          salaryRange = `Hasta $${formData.salaryMax}`
        }
      }

      // Crear el proceso en Supabase
      const { data: processData, error: processError } = await supabase
        .from('processes')
        .insert({
          title: formData.position,
          description: formData.description,
          manager: formData.managerName,
          salary_range: salaryRange || null,
          status: 'Activo'
        })
        .select()
        .single()

      if (processError) {
        throw new Error(`Error al crear proceso: ${processError.message}`)
      }

      // Crear las etapas del proceso
      const stagesWithOrder = stages.map((stage, index) => ({
        process_id: processData.id,
        name: stage.name,
        responsible: stage.responsibleName || null,
        order: index + 1
      }))

      const { error: stagesError } = await supabase
        .from('stages')
        .insert(stagesWithOrder)

      if (stagesError) {
        throw new Error(`Error al crear etapas: ${stagesError.message}`)
      }

      // Éxito: mostrar mensaje y redirigir al proceso creado
      alert("¡Proceso creado exitosamente!")
      window.location.href = `/processes/${processData.id}`
      
    } catch (error) {
      console.error('Error creating process:', error)
      alert(`Error al crear proceso: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => (window.location.href = "/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Nuevo Proceso de Reclutamiento</h1>
              <p className="text-muted-foreground">Configura un nuevo proceso con etapas personalizadas</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Detalles generales del proceso de reclutamiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Nombre del Cargo *</Label>
                  <Input
                    id="position"
                    placeholder="ej. Desarrollador Frontend Senior"
                    value={formData.position}
                    onChange={(e) => handleInputChange("position", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager">Manager Solicitante *</Label>
                  <Select onValueChange={handleManagerSelect} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          <div className="flex flex-col">
                            <span>{manager.full_name}</span>
                            <span className="text-xs text-muted-foreground">{manager.role}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Cargo *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe las responsabilidades principales del cargo..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">Detalles Adicionales</Label>
                <Textarea
                  id="details"
                  placeholder="Requisitos técnicos, experiencia requerida, beneficios..."
                  value={formData.details}
                  onChange={(e) => handleInputChange("details", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryMin">Salario Mínimo</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    placeholder="60000"
                    value={formData.salaryMin}
                    onChange={(e) => handleInputChange("salaryMin", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salaryMax">Salario Máximo</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    placeholder="80000"
                    value={formData.salaryMax}
                    onChange={(e) => handleInputChange("salaryMax", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stages Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Configuración de Etapas</CardTitle>
                  <CardDescription>
                    Define las etapas del proceso y asigna responsables. 
                    <br />
                    <span className="text-xs text-blue-600 font-medium">💡 Arrastra las etapas para reordenarlas</span>
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addStage}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Etapa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={stages.map(stage => stage.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {stages.map((stage, index) => (
                      <SortableStage
                        key={stage.id}
                        stage={stage}
                        index={index}
                        users={users}
                        onStageChange={handleStageChange}
                        onRemoveStage={removeStage}
                        canRemove={stages.length > 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => (window.location.href = "/dashboard")}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loading ? "Creando..." : "Crear Proceso"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
