"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, GripVertical, User } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data for managers and users
const mockManagers = [
  { id: 1, name: "Ana García", email: "ana@empresa.com" },
  { id: 2, name: "Carlos López", email: "carlos@empresa.com" },
  { id: 3, name: "María Rodríguez", email: "maria@empresa.com" },
]

const mockUsers = [
  { id: 1, name: "Juan Pérez", email: "juan@empresa.com" },
  { id: 2, name: "Ana García", email: "ana@empresa.com" },
  { id: 3, name: "Carlos López", email: "carlos@empresa.com" },
  { id: 4, name: "María Rodríguez", email: "maria@empresa.com" },
  { id: 5, name: "Luis Martín", email: "luis@empresa.com" },
]

interface Stage {
  id: string
  name: string
  responsibleId: string
  responsibleName: string
}

export default function NewProcess() {
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleManagerSelect = (managerId: string) => {
    const manager = mockManagers.find((m) => m.id.toString() === managerId)
    setFormData((prev) => ({
      ...prev,
      managerId,
      managerName: manager?.name || "",
    }))
  }

  const handleStageChange = (stageId: string, field: string, value: string) => {
    setStages((prev) =>
      prev.map((stage) => {
        if (stage.id === stageId) {
          if (field === "responsibleId") {
            const user = mockUsers.find((u) => u.id.toString() === value)
            return {
              ...stage,
              responsibleId: value,
              responsibleName: user?.name || "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newProcessId = Date.now() // Generate unique ID based on timestamp

    // Mock: Create process
    console.log("Creating process:", {
      id: newProcessId,
      formData,
      stages,
    })

    // Show success message (you could add a toast notification here)
    alert("Proceso creado exitosamente!")

    // Redirect back to dashboard to see the new process
    window.location.href = "/dashboard"
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
                      {mockManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id.toString()}>
                          {manager.name}
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
                  <CardDescription>Define las etapas del proceso y asigna responsables</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addStage}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Etapa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary">{index + 1}</Badge>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-sm">Nombre de la Etapa</Label>
                        <Input
                          placeholder="ej. Entrevista Técnica"
                          value={stage.name}
                          onChange={(e) => handleStageChange(stage.id, "name", e.target.value)}
                          disabled={stage.name === "Aplicación"}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm">Responsable</Label>
                        {stage.name === "Aplicación" ? (
                          <div className="flex items-center space-x-2 px-3 py-2 bg-secondary rounded-md">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Sistema</span>
                          </div>
                        ) : (
                          <Select onValueChange={(value) => handleStageChange(stage.id, "responsibleId", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar responsable" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>

                    {stages.length > 1 && stage.name !== "Aplicación" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStage(stage.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => (window.location.href = "/dashboard")}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Crear Proceso
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
