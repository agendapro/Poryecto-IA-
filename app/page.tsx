"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function HomePage() {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.replace("/dashboard")
      } else {
        router.replace("/login")
      }
    }
  }, [session, loading, router])

  // Muestra un estado de carga mientras se verifica la sesión
  return <div>Cargando...</div>
}
