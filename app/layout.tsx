import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { RecruitmentProvider } from "@/lib/recruitment-context"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RecruitPro",
  description: "Plataforma de gestión de reclutamiento",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <RecruitmentProvider>
            <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
              {children}
              <Toaster position="top-right" expand={true} richColors />
            </ThemeProvider>
          </RecruitmentProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
