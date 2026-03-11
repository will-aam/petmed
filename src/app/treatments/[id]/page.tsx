"use client"

import { useEffect, useState, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { LoadingState } from "@/components/feedback/loading-state"
import { TreatmentStatusBadge } from "@/components/status/treatment-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Activity, Play, Pause, XCircle, CheckCircle2, ListFilter, Pill } from "lucide-react"

export default function TreatmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { status } = useSession()
  const router = useRouter()
  const [treatment, setTreatment] = useState<any>(null)
  const [adherence, setAdherence] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = async () => {
    try {
      const tRes = await fetch(`/api/treatments/${id}`)
      if (!tRes.ok) throw new Error()
      const tData = await tRes.json()
      setTreatment(tData)

      if (tData.status !== "DRAFT") {
        const aRes = await fetch(`/api/treatments/${id}/adherence`)
        if (aRes.ok) setAdherence(await aRes.json())
      }
    } catch {
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
    if (status === "authenticated") fetchData()
  }, [status, id])

  const handleAction = async (action: "activate" | "pause" | "resume" | "close" | "cancel") => {
    if (!confirm(`Deseja realmente ${action} este tratamento?`)) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/treatments/${id}/${action}`, { method: "POST" })
      if (!res.ok) throw new Error()
      toast({ title: "Sucesso", description: `Ação ${action} executada com sucesso.` })
      fetchData()
      router.refresh()
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao executar ação." })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <PageContainer><LoadingState message="Carregando tratamento..." /></PageContainer>
  if (!treatment) return null

  return (
    <PageContainer
      title={treatment.title}
      description={`Tratamento p/ ${treatment.pet.name} (Início: ${formatDate(treatment.startDate)})`}
      action={
        <Link href={`/treatments/${id}/doses`}>
          <Button variant="outline"><ListFilter className="mr-2 h-4 w-4" /> Histórico de Doses</Button>
        </Link>
      }
    >
      <div className="flex items-center gap-3 mb-8 bg-muted/50 w-full p-4 rounded-lg border">
        <span className="font-semibold">Status do Ciclo:</span>
        <TreatmentStatusBadge status={treatment.status} />
        
        <div className="ml-auto flex flex-wrap gap-2">
          {treatment.status === "DRAFT" && (
            <>
              <Button disabled={actionLoading} onClick={() => handleAction("activate")} className="bg-blue-600 hover:bg-blue-700">
                <Play className="h-4 w-4 mr-2" /> Ativar Plano
              </Button>
              <Button disabled={actionLoading} variant="ghost" onClick={() => handleAction("cancel")} className="text-destructive">
                Cancelar
              </Button>
            </>
          )}

          {treatment.status === "ACTIVE" && (
            <>
              <Button disabled={actionLoading} variant="outline" onClick={() => handleAction("pause")}>
                <Pause className="h-4 w-4 mr-2" /> Pausar
              </Button>
              <Button disabled={actionLoading} onClick={() => handleAction("close")} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Concluir
              </Button>
              <Button disabled={actionLoading} variant="ghost" onClick={() => handleAction("cancel")} className="text-destructive">
                <XCircle className="h-4 w-4 mr-2" /> Cancelar
              </Button>
            </>
          )}

          {treatment.status === "PAUSED" && (
            <>
              <Button disabled={actionLoading} onClick={() => handleAction("resume")}>
                <Play className="h-4 w-4 mr-2" /> Retomar
              </Button>
              <Button disabled={actionLoading} variant="ghost" onClick={() => handleAction("cancel")} className="text-destructive">
                <XCircle className="h-4 w-4 mr-2" /> Cancelar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
            <Pill className="h-5 w-5 text-primary" /> Medicamentos (Regras)
          </h3>
          
          <div className="space-y-4">
            {treatment.items.map((item: any, i: number) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
                  <span className="font-semibold text-primary">{item.medicationName}</span>
                  <span className="text-sm font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{item.administrationRoute}</span>
                </div>
                <CardContent className="p-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div><strong>Dose:</strong> {item.dosageAmount} {item.dosageUnit}</div>
                  <div><strong>Alvo:</strong> {item.targetSide}</div>
                  <div><strong>Recorrência:</strong> {item.recurrenceType === "INTERVAL" ? `A cada ${item.intervalHours}h` : "Horários Fixos"}</div>
                  <div><strong>Janela (Tolerância):</strong> {item.toleranceWindowMins} min</div>
                  {item.instructions && <div className="sm:col-span-2"><strong>Instruções:</strong> {item.instructions}</div>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-base flex gap-2 items-center"><Activity className="w-4 h-4 text-emerald-600"/> Aderência do Tratamento</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center space-y-4">
              {treatment.status === "DRAFT" ? (
                <p className="text-muted-foreground text-sm">O tratamento precisa estar ativo para gerar métricas de aderência.</p>
              ) : adherence ? (
                <>
                  <div className="text-4xl font-extrabold text-slate-800">
                    {adherence.percentage !== null ? `${Math.round(adherence.percentage)}%` : "--%"}
                  </div>
                  <p className="text-sm text-slate-500 font-medium">
                    {adherence.numerator} doses aplicadas de {adherence.denominator} avaliadas.
                  </p>
                  
                  <div className="h-2 w-full bg-slate-100 rounded-full mt-4 overflow-hidden">
                    <div 
                      className={`h-full ${adherence.percentage >= 80 ? 'bg-emerald-500' : adherence.percentage >= 50 ? 'bg-amber-400' : 'bg-red-500'}`} 
                      style={{ width: `${adherence.percentage || 0}%` }} 
                    />
                  </div>
                </>
              ) : (
                <LoadingState message="Carregando aderência..." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
