"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { LoadingState } from "@/components/feedback/loading-state"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Plus, User2, ChevronRight } from "lucide-react"

type Pet = {
  id: string
  name: string
  species: string
  breed: string | null
  age: number | null
  treatments: { id: string; status: string }[]
}

export default function PetsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/pets")
      .then((res) => res.json())
      .then((data) => setPets(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [status])

  if (status === "loading" || loading) return <PageContainer><LoadingState message="Carregando pets..." /></PageContainer>

  return (
    <PageContainer 
      title="Meus Pets" 
      action={
        <Link href="/pets/new">
          <Button><Plus className="h-4 w-4 mr-2" /> Cadastrar Pet</Button>
        </Link>
      }
    >
      {pets.length === 0 ? (
        <EmptyState 
          title="Nenhum pet cadastrado" 
          message="Comece cadastrando seu pet para organizar os tratamentos."
          action={
            <Link href="/pets/new">
              <Button variant="outline" className="mt-4">Cadastrar Pet</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <Link key={pet.id} href={`/pets/${pet.id}`}>
              <Card className="hover:border-primary/50 transition-colors h-full flex flex-col cursor-pointer group">
                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <User2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle>{pet.name}</CardTitle>
                    <CardDescription>{pet.species} {pet.breed ? `• ${pet.breed}` : ""}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      {pet.treatments.length} tratamentos em andamento
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
