import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()

  // Cerrar sesión
  await supabase.auth.signOut()

  // Redirigir a la página de login
  return NextResponse.redirect(new URL('/login', request.url))
}
