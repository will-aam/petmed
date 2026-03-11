"use client"

import { useEffect, useState, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { LoadingState } from "@/components/feedback/loading-state"
import { EmptyState } from "@/components/feedback/empty-state"
import { TreatmentStatusBadge } from "@/components/status/treatment-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { Plus, Pill, CalendarDays, Weight, Hash } from "lucide-react"

type TreatmentItem = { id: string; medicationName: string }
type Treatment = { id: string; title: string; status: any; startDate: string; items: TreatmentItem[] }
type Pet = {
  id: string
  name: string
  species: string
  breed: string | null
  age: number | null
  weight: number | null
  notes: string | null
  treatments: Treatment[]
}

export default function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { status } = useSession()
  const router = useRouter()
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch(`/api/pets/${id}`)
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setPet(data))
      .catch(() => router.push("/pets"))
      .finally(() => setLoading(false))
  }, [id, status, router])

  if (status === "loading" || loading) return <PageContainer><LoadingState message="Carregando pet..." /></PageContainer>
  if (!pet) return null

  return (
    <PageContainer
      title={pet.name}
      description={`${pet.species}${pet.breed ? ` • ${pet.breed}` : ""}`}
      action={
        <div className="flex gap-2">
          <Link href={`/treatments/new?petId=${pet.id}`}>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Tratamento</Button>
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ficha do Animal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-4 w-4" /> <strong>Idade:</strong> {pet.age ? `${pet.age} anos` : "Não informada"}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Weight className="h-4 w-4" /> <strong>Peso:</strong> {pet.weight ? `${pet.weight} kg` : "Não informado"}
              </div>
              {pet.notes && (
                <div className="pt-4 border-t">
                  <p className="font-semibold mb-1">Observações:</p>
                  <p className="text-muted-foreground leading-relaxed">{pet.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" /> Histórico de Tratamentos
          </h2>
          
          {pet.treatments.length === 0 ? (
            <EmptyState 
              title="Nenhum tratamento" 
              message="Este pet ainda não possui tratamentos cadastrados."
              action={
                <Link href={`/treatments/new?petId=${pet.id}`}>
                  <Button variant="outline" className="mt-4">Criar Primeiro Tratamento</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {pet.treatments.map((t) => (
                <Link key={t.id} href={`/treatments/${t.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                    <CardHeader className="p-4 sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <CardTitle className="text-base text-primary group-hover:underline">{t.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <CalendarDays className="h-3 w-3" /> Início em {formatDate(t.startDate)}
                        </CardDescription>
                      </div>
                      <TreatmentStatusBadge status={t.status} />
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <p className="text-sm text-muted-foreground">
                        {t.items.length} {t.items.length === 1 ? "medicamento" : "medicamentos"}:{" "}
                        {t.items.map(i => i.medicationName).join(", ")}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
