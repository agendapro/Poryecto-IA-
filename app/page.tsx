"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loading } from "@/components/ui/loading"

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
  return <Loading fullScreen text="Iniciando RecruitPro..." size="xl" />
}
