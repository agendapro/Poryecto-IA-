"use client"

import { useAuth } from "@/lib/auth-context"
import { useRecruitment } from "@/lib/recruitment-context"
import { Loading } from "@/components/ui/loading"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { ComponentType } from "react"

export default function withAuth<P extends object>(Component: ComponentType<P>) {
  return function WithAuth(props: P) {
    const { session, loading: authLoading } = useAuth()
    const { loading: dataLoading } = useRecruitment()
    const router = useRouter()

    useEffect(() => {
      if (!authLoading && !session) {
        router.push("/login")
      }
    }, [session, authLoading, router])

    // Mostrar loading si cualquiera de los dos está cargando
    if (authLoading) {
      return <Loading fullScreen text="Verificando autenticación..." size="lg" />
    }

    if (!session) {
      return null // Evita renderizar el componente si no hay sesión
    }

    // Solo mostrar loading de datos si hay sesión activa
    if (dataLoading) {
      return <Loading fullScreen text="Cargando datos..." size="lg" />
    }

    return <Component {...props} />
  }
}
