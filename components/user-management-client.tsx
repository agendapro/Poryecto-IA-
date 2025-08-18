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
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user: UserData) => (
            <TableRow key={user.id}>
              <TableCell>{user.full_name || "N/A"}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
