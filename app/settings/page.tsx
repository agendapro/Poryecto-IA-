import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowLeft, Settings, LogOut, User } from "lucide-react"
import UserManagementClient from "@/components/user-management-client"

// Tipos para los datos de los usuarios
type UserData = {
  id: string
  email: string | undefined
  full_name: string | null
  role: string | null
}

export default async function SettingsPage() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Obtener el perfil del usuario actual para verificar el rol
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

  if (profile?.role !== "Administrador") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>No tienes permisos de administrador para ver esta página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Obtener todos los usuarios usando la función RPC segura
  const { data: users, error: usersError } = await supabase.rpc("get_all_users_with_profiles")
  
  console.log('👥 Users query result:', { users: users?.length || 0, error: usersError })

  // Server Action para crear un nuevo usuario
  async function addUser(formData: FormData) {
    "use server"
    const fullName = formData.get("full_name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as string

    // Validar que todos los campos requeridos estén presentes
    if (!fullName || !email || !password || !role) {
      return { error: "Todos los campos son requeridos." }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !serviceKey) {
      return { error: "Error: Faltan las variables de entorno de Supabase (URL o Service Key). Asegúrate de que tu archivo .env.local esté configurado y reinicia el servidor." }
    }

    // Necesitamos un cliente de Supabase con permisos de 'service_role' para crear usuarios
    const cookieStore = cookies()
    const supabaseAdmin = createServerClient(
      supabaseUrl,
      serviceKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirma el email
      user_metadata: { full_name: fullName },
    })

    if (error) {
      
      // Mensajes de error más amigables
      let friendlyMessage = error.message
      if (error.message.includes('already been registered')) {
        friendlyMessage = `Ya existe un usuario con el email "${email}". Por favor usa otro email.`
      } else if (error.message.includes('Invalid email')) {
        friendlyMessage = `El email "${email}" no es válido. Verifica el formato.`
      } else if (error.message.includes('Password')) {
        friendlyMessage = `La contraseña debe tener al menos 6 caracteres.`
      }
      
      return { error: friendlyMessage }
    }

    // Si el usuario se crea en auth, actualizamos su rol en la tabla profiles
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ role: role, full_name: fullName })
        .eq("id", data.user.id)
      
      if (profileError) {
        console.error("Error setting user role:", profileError)
        return { error: profileError.message }
      }
    }
    
    return { error: null }
  }

  // Obtener el perfil del usuario actual para el menú
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", session.user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
              <p className="text-gray-600">Gestión de usuarios del sistema</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>
                      {currentProfile?.full_name
                        ? currentProfile.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : session.user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-bold">{currentProfile?.full_name || "Usuario"}</div>
                  <div className="text-xs text-muted-foreground">{session.user.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Rol: {currentProfile?.role || "Sin rol"}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action="/auth/signout" method="post">
                    <button type="submit" className="flex items-center w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>Añade y gestiona los usuarios del sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            {usersError ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">Error cargando usuarios:</p>
                <p className="text-sm text-gray-600 mb-4">{usersError.message}</p>
                <Button onClick={() => window.location.reload()}>
                  Intentar de nuevo
                </Button>
              </div>
            ) : (
              <UserManagementClient initialUsers={users || []} addUserAction={addUser} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
