"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import AddUserDialog from "@/components/add-user-dialog"

type UserData = {
  id: string
  email: string | undefined
  full_name: string | null
  role: string | null
}

type UserManagementClientProps = {
  initialUsers: UserData[]
  addUserAction: (formData: FormData) => Promise<{ error: string | null }>
}

export default function UserManagementClient({ initialUsers, addUserAction }: UserManagementClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const router = useRouter()

  const handleUserAdded = () => {
    // Refresca los datos del servidor para obtener la lista de usuarios actualizada
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <AddUserDialog onUserAdded={handleUserAdded} serverAction={addUserAction} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Rol</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                {users.length === 0 ? "Cargando usuarios..." : "No hay usuarios registrados"}
              </TableCell>
            </TableRow>
          ) : (
            users.map((user: UserData) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email || "Sin email"}</TableCell>
                <TableCell>{user.full_name || "Sin nombre"}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'Administrador' ? 'bg-red-100 text-red-800' :
                    user.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'Reclutador' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role || "Sin rol"}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </>
  )
}
