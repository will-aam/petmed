"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, Stethoscope } from "lucide-react"

export function Navbar() {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            <span className="inline-block font-bold text-lg text-primary">PetMed</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/pets"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pets
            </Link>
            <Link
              href="/treatments/new"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Novo Tratamento
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline-block">
            {session.user?.email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Sair"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline-block">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
