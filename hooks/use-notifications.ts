"use client"

import { toast } from "sonner"

// Hook personalizado para notificaciones con diferentes tipos
export function useNotifications() {
  const success = (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    })
  }

  const error = (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 6000,
    })
  }

  const warning = (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 5000,
    })
  }

  const info = (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    })
  }

  const loading = (message: string) => {
    return toast.loading(message)
  }

  const dismiss = (toastId?: string | number) => {
    toast.dismiss(toastId)
  }

  // Notificaciones específicas para el dominio de la aplicación
  const candidateCreated = (candidateName: string) => {
    success("Candidato agregado", `${candidateName} ha sido agregado exitosamente`)
  }

  const candidateRejected = (candidateName: string) => {
    info("Candidato rechazado", `${candidateName} ha sido movido a rechazados`)
  }

  const candidateMoved = (candidateName: string, stageName: string) => {
    success("Candidato movido", `${candidateName} ahora está en ${stageName}`)
  }

  const processCreated = (processTitle: string) => {
    success("Proceso creado", `El proceso "${processTitle}" ha sido creado exitosamente`)
  }

  const processDeleted = (processTitle: string) => {
    success("Proceso eliminado", `El proceso "${processTitle}" ha sido eliminado`)
  }

  const userCreated = (userName: string) => {
    success("Usuario creado", `${userName} ha sido agregado al sistema`)
  }

  const cvUploaded = (candidateName: string) => {
    success("CV subido", `CV de ${candidateName} actualizado correctamente`)
  }

  const emailSent = (candidateName: string) => {
    info("Email enviado", `Notificación enviada para ${candidateName}`)
  }

  return {
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    candidateCreated,
    candidateRejected,
    candidateMoved,
    processCreated,
    processDeleted,
    userCreated,
    cvUploaded,
    emailSent,
  }
}
