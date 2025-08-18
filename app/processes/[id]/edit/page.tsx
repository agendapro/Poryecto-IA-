"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner, Loading } from "@/components/ui/loading"
import { useRecruitment } from "@/lib/recruitment-context"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import withAuth from "@/components/withAuth"

interface User {
  id: string
  full_name: string
  role: string
}

function EditProcess({ params }: { params: Promise<{ id: string }> }) {
  const { getProcess, updateProcess, loading: dataLoading } = useRecruitment()
  const { user } = useAuth()
  const supabase = createClient()
  const router = useRouter()
  
  const { id } = use(params)
  const processId = Number(id)
  const process = getProcess(processId)

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    manager: "",
    managerId: "",
    salaryMin: "",
    salaryMax: "",
    status: "Activo",
  })

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

  // Cargar datos del proceso al montar el componente
  useEffect(() => {
    if (process && users.length > 0) {
      // Extraer rango salarial
      let salaryMin = ""
      let salaryMax = ""
      
      if (process.salary_range) {
        const salaryMatch = process.salary_range.match(/\$?(\d+(?:,\d+)*)\s*-\s*\$?(\d+(?:,\d+)*)/)
        if (salaryMatch) {
          salaryMin = salaryMatch[1].replace(/,/g, '')
          salaryMax = salaryMatch[2].replace(/,/g, '')
        }
      }

      // Buscar el ID del manager basado en el nombre
      const currentManager = users.find(user => user.full_name === process.manager)

      setFormData({
        title: process.title,
        description: process.description || "",
        manager: process.manager || "",
        managerId: currentManager?.id || "",
        salaryMin,
        salaryMax,
        status: process.status,
      })
    }
  }, [process, users])

  // Mostrar loading mientras se cargan los datos
  if (dataLoading) {
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

  // Filtrar usuarios que pueden ser managers
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
      manager: manager?.full_name || "",
      managerId: managerId,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.manager) {
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

      // Actualizar el proceso usando el contexto
      await updateProcess(processId, {
        title: formData.title,
        description: formData.description,
        manager: formData.manager,
        salary_range: salaryRange || null,
        status: formData.status
      })

      // Éxito: mostrar mensaje y redirigir
      alert("¡Proceso actualizado exitosamente!")
      router.push(`/processes/${processId}`)
      
    } catch (error) {
      console.error('Error updating process:', error)
      alert(`Error al actualizar proceso: ${error instanceof Error ? error.message : 'Error desconocido'}`)
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
            <Button variant="ghost" onClick={() => router.push(`/processes/${processId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Editar Proceso</h1>
              <p className="text-muted-foreground">Modifica la información del proceso de reclutamiento</p>
            </div>
          </div>
          
          <Badge className="bg-blue-100 text-blue-800">
            {formData.status}
          </Badge>
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
                  <Label htmlFor="title">Nombre del Cargo *</Label>
                  <Input
                    id="title"
                    placeholder="ej. Desarrollador Frontend Senior"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager">Manager Solicitante *</Label>
                  <Select value={formData.managerId} onValueChange={handleManagerSelect}>
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
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="status">Estado del Proceso</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Pausado">Pausado</SelectItem>
                      <SelectItem value="Cerrado">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push(`/processes/${processId}`)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Guardando...</span>
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default withAuth(EditProcess)
