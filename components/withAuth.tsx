"use client"

import { useAuth } from "@/lib/auth-context"
import { Loading } from "@/components/ui/loading"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { ComponentType } from "react"

export default function withAuth<P extends object>(Component: ComponentType<P>) {
  return function WithAuth(props: P) {
    const { session, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading && !session) {
        router.push("/login")
      }
    }, [session, loading, router])

    if (loading) {
      return <Loading fullScreen text="Verificando autenticación..." size="lg" />
    }

    if (!session) {
      return null // Evita renderizar el componente si no hay sesión
    }

    return <Component {...props} />
  }
}
