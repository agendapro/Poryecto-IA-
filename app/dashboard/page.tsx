"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import withAuth from "@/components/withAuth"
import { useAuth } from "@/lib/auth-context"
import { useRecruitment } from "@/lib/recruitment-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loading } from "@/components/ui/loading"
import { Bell, User, Settings, LogOut, Search, Plus, Filter, MoreHorizontal, Users, Clock, CheckCircle, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const getStatusColor = (status: string) => {
  switch (status) {
    case "Activo":
      return "bg-green-100 text-green-800"
    case "Pausado":
      return "bg-yellow-100 text-yellow-800"
    case "Cerrado":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Activo":
      return <CheckCircle className="h-4 w-4" />
    case "Pausado":
      return <Clock className="h-4 w-4" />
    case "Cerrado":
      return <XCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("Todos")
  const { user, profile, signOut } = useAuth()
  const { processes, candidates, stages, loading } = useRecruitment()

  // Crear procesos enriquecidos con estadísticas
  const enrichedProcesses = useMemo(() => {
    return processes.map(process => {
      const processCandidates = candidates.filter(c => c.process_id === process.id)
      const processStages = stages.filter(s => s.process_id === process.id).length
      
      return {
        id: process.id,
        position: process.title,
        manager: process.manager || "Sin asignar",
        status: process.status,
        candidates: processCandidates.length,
        stages: processStages,
        created: process.created_at,
        salary: process.salary_range || "No especificado",
      }
    })
  }, [processes, candidates, stages])

  const filteredProcesses = enrichedProcesses.filter((process) => {
    const matchesSearch =
      process.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.manager.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = selectedFilter === "Todos" || process.status === selectedFilter
    return matchesSearch && matchesFilter
  })

  // Calcular estadísticas
  const stats = useMemo(() => {
    const activeProcesses = processes.filter(p => p.status === 'Activo').length
    const totalCandidates = candidates.length
    const activeCandidates = candidates.filter(c => c.status === 'Activo').length
    const hiredCandidates = candidates.filter(c => c.status === 'Contratado').length

    return {
      activeProcesses,
      totalCandidates,
      activeCandidates,
      hiredCandidates
    }
  }, [processes, candidates])

  if (loading) {
    return <Loading fullScreen text="Cargando dashboard..." size="xl" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              RecruitPro
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>
                      {profile?.full_name
                        ? profile.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="font-bold">{profile?.full_name || "Usuario"}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-100">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="group border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-300 ease-out hover:-translate-y-1 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-green-700 transition-colors duration-200">Procesos Activos</CardTitle>
              <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-200">
                <CheckCircle className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform duration-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 group-hover:text-green-800 transition-colors duration-200">{stats.activeProcesses}</div>
              <p className="text-xs text-muted-foreground group-hover:text-green-600 transition-colors duration-200">Procesos en reclutamiento</p>
            </CardContent>
          </Card>

          <Card className="group border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 ease-out hover:-translate-y-1 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-blue-700 transition-colors duration-200">Total Candidatos</CardTitle>
              <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                <Users className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 group-hover:text-blue-800 transition-colors duration-200">{stats.totalCandidates}</div>
              <p className="text-xs text-muted-foreground group-hover:text-blue-600 transition-colors duration-200">Candidatos registrados</p>
            </CardContent>
          </Card>

          <Card className="group border border-gray-200 hover:border-yellow-300 hover:shadow-md transition-all duration-300 ease-out hover:-translate-y-1 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-yellow-700 transition-colors duration-200">En Proceso</CardTitle>
              <div className="p-1.5 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors duration-200">
                <Clock className="h-4 w-4 text-yellow-600 group-hover:scale-110 transition-transform duration-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700 group-hover:text-yellow-800 transition-colors duration-200">{stats.activeCandidates}</div>
              <p className="text-xs text-muted-foreground group-hover:text-yellow-600 transition-colors duration-200">En diferentes etapas</p>
            </CardContent>
          </Card>

          <Card className="group border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-300 ease-out hover:-translate-y-1 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-purple-700 transition-colors duration-200">Contratados</CardTitle>
              <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-200">
                <CheckCircle className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 group-hover:text-purple-800 transition-colors duration-200">{stats.hiredCandidates}</div>
              <p className="text-xs text-muted-foreground group-hover:text-purple-600 transition-colors duration-200">Contrataciones exitosas</p>
            </CardContent>
          </Card>
        </div>

        {/* Processes Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Procesos de Reclutamiento</CardTitle>
                <CardDescription>Gestiona y da seguimiento a todos los procesos activos</CardDescription>
              </div>
              <Button
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={() => (window.location.href = "/processes/new")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proceso
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por cargo o manager..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    {selectedFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedFilter("Todos")}>Todos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("Activo")}>Activo</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("Pausado")}>Pausado</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("Cerrado")}>Cerrado</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Processes List */}
            <div className="space-y-4">
              {filteredProcesses.map((process) => (
                <Card
                  key={process.id}
                  className="group relative border border-gray-200 bg-white transition-all duration-300 ease-out cursor-pointer hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
                  onClick={() => (window.location.href = `/processes/${process.id}`)}
                >
                  {/* Subtle gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-50/0 to-blue-50/0 group-hover:from-purple-50/30 group-hover:to-blue-50/30 transition-all duration-300 ease-out rounded-lg pointer-events-none" />
                  
                  <CardContent className="relative p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition-colors duration-200">
                            {process.position}
                          </h3>
                          <Badge className={`${getStatusColor(process.status)} transition-all duration-200 group-hover:scale-105`}>
                            <span className="transition-transform duration-200 group-hover:scale-110 inline-block">
                              {getStatusIcon(process.status)}
                            </span>
                            <span className="ml-1">{process.status}</span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-gray-700">Manager:</span> 
                            <span className="group-hover:text-purple-600 transition-colors duration-200">{process.manager}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-gray-700">Candidatos:</span> 
                            <span className="font-semibold text-blue-600 group-hover:text-blue-700 transition-colors duration-200">{process.candidates}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-gray-700">Etapas:</span> 
                            <span className="font-semibold text-green-600 group-hover:text-green-700 transition-colors duration-200">{process.stages}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-gray-700">Salario:</span> 
                            <span className="text-purple-600 group-hover:text-purple-700 transition-colors duration-200 truncate">{process.salary}</span>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                          <span className="inline-flex items-center">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5 group-hover:bg-purple-400 transition-colors duration-200"></div>
                            Creado: {new Date(process.created).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => e.stopPropagation()}
                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-purple-100 hover:scale-105 active:scale-95"
                          >
                            <MoreHorizontal className="h-4 w-4 text-gray-500 hover:text-purple-600 transition-colors duration-200" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            onClick={() => (window.location.href = `/processes/${process.id}`)}
                            className="hover:bg-purple-50 cursor-pointer"
                          >
                            <Users className="mr-2 h-4 w-4 text-purple-600" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => (window.location.href = `/processes/${process.id}/edit`)}
                            className="hover:bg-blue-50 cursor-pointer"
                          >
                            <Settings className="mr-2 h-4 w-4 text-blue-600" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 hover:bg-red-50 cursor-pointer">
                            <XCircle className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default withAuth(DashboardPage)
