"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { DoseStatusBadge } from "@/components/status/dose-status-badge"
import { LoadingState } from "@/components/feedback/loading-state"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { formatTime } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Slash } from "lucide-react"

type Dose = {
  id: string
  scheduledFor: string
  status: "PENDING" | "APPLIED" | "MISSED" | "SKIPPED" | "CANCELED"
  pet: { name: string; photoUrl: string | null }
  treatmentItem: { medicationName: string; dosageAmount: number; dosageUnit: string; administrationRoute: string }
}

export default function DashboardPage() {
  const { status } = useSession()
  const router = useRouter()
  const [doses, setDoses] = useState<Dose[]>([])
  const [loading, setLoading] = useState(true)
  const [mutatingId, setMutatingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  const fetchDoses = async () => {
    try {
      const res = await fetch("/api/doses")
      if (!res.ok) throw new Error("Falha ao carregar")
      const data = await res.json()
      setDoses(data)
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar a agenda de hoje." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") fetchDoses()
  }, [status])

  const handleAction = async (id: string, action: "apply" | "skip") => {
    setMutatingId(id)
    try {
      const res = await fetch(`/api/doses/${id}/${action}`, { method: "POST" })
      if (!res.ok) throw new Error("Erro na ação")
      toast({ title: "Sucesso", description: `Dose ${action === "apply" ? "aplicada" : "ignorada"} com sucesso.` })
      fetchDoses()
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível registrar a ação." })
    } finally {
      setMutatingId(null)
    }
  }

  if (status === "loading" || loading) return <PageContainer><LoadingState message="Carregando agenda..." /></PageContainer>

  return (
    <PageContainer title="Agenda de Hoje" description="Confira os medicamentos programados para seus pets hoje.">
      {doses.length === 0 ? (
        <EmptyState title="Nenhuma dose programada" message="Você não tem nenhuma medicação agendada para hoje." />
      ) : (
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {doses.map((dose) => (
            <Card key={dose.id} className={`overflow-hidden transition-all ${dose.status === "PENDING" ? "border-amber-200" : "opacity-80"}`}>
              <CardContent className="p-0 flex flex-col sm:flex-row items-center justify-between">
                <div className="flex w-full items-center p-4">
                  <div className="flex shrink-0 w-16 h-16 bg-slate-100 rounded-lg items-center justify-center font-bold text-lg text-slate-700">
                    {formatTime(dose.scheduledFor)}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-semibold text-base">{dose.treatmentItem.medicationName}</h4>
                    <p className="text-sm text-muted-foreground flex gap-1 items-center">
                      Para <strong>{dose.pet.name}</strong> • {dose.treatmentItem.dosageAmount} {dose.treatmentItem.dosageUnit} ({dose.treatmentItem.administrationRoute})
                    </p>
                  </div>
                  <div className="hidden sm:block ml-4 shrink-0">
                    <DoseStatusBadge status={dose.status} />
                  </div>
                </div>
                
                {/* Mobile Badge */}
                <div className="flex sm:hidden w-full px-4 pb-2 justify-start">
                  <DoseStatusBadge status={dose.status} />
                </div>

                {dose.status === "PENDING" && (
                  <div className="flex w-full sm:w-auto p-4 pt-0 sm:pt-4 sm:ml-auto gap-2 border-t sm:border-t-0 sm:border-l bg-slate-50 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => handleAction(dose.id, "skip")}
                      disabled={!!mutatingId}
                    >
                      <Slash className="w-4 h-4 mr-1 sm:mr-0" />
                      <span className="sm:hidden">Ignorar</span>
                    </Button>
                    <Button 
                      onClick={() => handleAction(dose.id, "apply")}
                      disabled={!!mutatingId}
                    >
                      <Check className="w-4 h-4 mr-1 sm:mr-0" />
                      <span className="sm:hidden">Aplicar</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
