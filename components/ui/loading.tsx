import React from 'react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  fullScreen?: boolean
  className?: string
}

const sizeConfig = {
  sm: {
    spinner: 'h-8 w-8',
    text: 'text-sm',
    container: 'p-4'
  },
  md: {
    spinner: 'h-12 w-12',
    text: 'text-base',
    container: 'p-6'
  },
  lg: {
    spinner: 'h-16 w-16',
    text: 'text-lg',
    container: 'p-8'
  },
  xl: {
    spinner: 'h-24 w-24',
    text: 'text-xl',
    container: 'p-12'
  }
}

export function Loading({ 
  size = 'lg', 
  text = 'Cargando...', 
  fullScreen = false,
  className = ''
}: LoadingProps) {
  const config = sizeConfig[size]
  
  const content = (
    <div className={`flex flex-col items-center justify-center ${config.container} ${className}`}>
      {/* Logo/Brand */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          RecruitPro
        </h1>
      </div>
      
      {/* Spinner principal */}
      <div className="relative mb-6">
        {/* Anillo exterior */}
        <div className={`${config.spinner} border-4 border-gray-200 rounded-full animate-pulse`}></div>
        
        {/* Anillo giratorio con gradiente */}
        <div className={`absolute inset-0 ${config.spinner} border-4 border-transparent rounded-full animate-spin`}
             style={{
               background: 'linear-gradient(45deg, transparent, transparent, #9333ea, #3b82f6)',
               mask: 'radial-gradient(circle at center, transparent 60%, black 60%)',
               WebkitMask: 'radial-gradient(circle at center, transparent 60%, black 60%)'
             }}>
        </div>
        
        {/* Centro con gradiente */}
        <div className={`absolute inset-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center`}>
          <div className="w-2 h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Texto */}
      <div className="text-center space-y-2">
        <p className={`${config.text} font-medium text-gray-700`}>{text}</p>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce"></div>
        </div>
      </div>
      
      {/* Barra de progreso animada */}
      <div className="w-48 h-1 bg-gray-200 rounded-full mt-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-full animate-pulse transform scale-x-75 origin-left"></div>
      </div>
    </div>
  )
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center z-50">
        {content}
      </div>
    )
  }
  
  return content
}

// Variante simple para usar en línea
export function LoadingSpinner({ 
  size = 'md', 
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  const config = sizeConfig[size]
  
  return (
    <div className={`relative ${config.spinner} ${className}`}>
      <div className={`${config.spinner} border-2 border-gray-200 rounded-full animate-pulse`}></div>
      <div className={`absolute inset-0 ${config.spinner} border-2 border-transparent border-t-purple-600 border-r-blue-600 rounded-full animate-spin`}></div>
    </div>
  )
}

// Para skeleton loading
export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center space-x-4">
        <div className="rounded-full bg-gradient-to-r from-purple-200 to-blue-200 h-10 w-10"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gradient-to-r from-purple-200 to-blue-200 rounded w-3/4"></div>
          <div className="h-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gradient-to-r from-purple-200 to-blue-200 rounded"></div>
        <div className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded w-5/6"></div>
        <div className="h-4 bg-gradient-to-r from-purple-200 to-blue-200 rounded w-4/6"></div>
      </div>
    </div>
  )
}
