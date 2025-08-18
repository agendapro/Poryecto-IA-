import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

  // Server Action para crear un nuevo usuario
  async function addUser(formData: FormData) {
    "use server"
    const fullName = formData.get("full_name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as string

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
      console.error("Error creating user:", error)
      return { error: error.message }
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

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>Añade y gestiona los usuarios del sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagementClient initialUsers={users || []} addUserAction={addUser} />
          {usersError && <p className="text-red-500 mt-4">{usersError.message}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
