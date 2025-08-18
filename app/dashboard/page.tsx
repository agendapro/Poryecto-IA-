"use client"

import { useState } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, User, Settings, LogOut, Search, Plus, Filter, MoreHorizontal, Users, Clock, CheckCircle, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// Mock data
const mockProcesses = [
  {
    id: 1,
    position: "Desarrollador Frontend Senior",
    manager: "Ana García",
    status: "Activo",
    candidates: 12,
    stages: 4,
    created: "2024-01-15",
    salary: "$80,000 - $100,000",
  },
  {
    id: 2,
    position: "Product Manager",
    manager: "Carlos López",
    status: "Activo",
    candidates: 8,
    stages: 5,
    created: "2024-01-10",
    salary: "$90,000 - $120,000",
  },
  {
    id: 3,
    position: "UX Designer",
    manager: "María Rodríguez",
    status: "Pausado",
    candidates: 5,
    stages: 3,
    created: "2024-01-05",
    salary: "$60,000 - $80,000",
  },
  {
    id: 4,
    position: "DevOps Engineer",
    manager: "Juan Martínez",
    status: "Cerrado",
    candidates: 15,
    stages: 4,
    created: "2023-12-20",
    salary: "$85,000 - $110,000",
  },
]

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

  const filteredProcesses = mockProcesses.filter((process) => {
    const matchesSearch =
      process.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.manager.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = selectedFilter === "Todos" || process.status === selectedFilter
    return matchesSearch && matchesFilter
  })

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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Procesos Activos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidatos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247</div>
              <p className="text-xs text-muted-foreground">+18 esta semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">En diferentes etapas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratados</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
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
                  className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer hover:bg-gray-50 border-2 hover:border-purple-200"
                  onClick={() => (window.location.href = `/processes/${process.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-purple-700 group-hover:text-purple-800">
                            {process.position}
                          </h3>
                          <Badge className={getStatusColor(process.status)}>
                            {getStatusIcon(process.status)}
                            <span className="ml-1">{process.status}</span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Manager:</span> {process.manager}
                          </div>
                          <div>
                            <span className="font-medium">Candidatos:</span> {process.candidates}
                          </div>
                          <div>
                            <span className="font-medium">Etapas:</span> {process.stages}
                          </div>
                          <div>
                            <span className="font-medium">Salario:</span> {process.salary}
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                          Creado: {new Date(process.created).toLocaleDateString("es-ES")}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => (window.location.href = `/processes/${process.id}`)}>
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => (window.location.href = `/processes/${process.id}/edit`)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Eliminar</DropdownMenuItem>
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
