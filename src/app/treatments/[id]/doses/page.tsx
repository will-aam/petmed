"use client"

import { useEffect, useState, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { LoadingState } from "@/components/feedback/loading-state"
import { EmptyState } from "@/components/feedback/empty-state"
import { DoseStatusBadge } from "@/components/status/dose-status-badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDateTime } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"

type Dose = {
  id: string
  scheduledFor: string
  status: any
  appliedAt: string | null
  skippedAt: string | null
  note: string | null
  applicationTiming: string | null
  treatmentItem: { medicationName: string }
}

export default function TreatmentDosesLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { status } = useSession()
  const router = useRouter()
  const [doses, setDoses] = useState<Dose[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
    if (status !== "authenticated") return

    fetch(`/api/treatments/${id}/doses`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setDoses(data))
      .catch(() => router.push(`/treatments/${id}`))
      .finally(() => setLoading(false))
  }, [id, status])

  if (loading) return <PageContainer><LoadingState message="Carregando histórico..." /></PageContainer>

  return (
    <PageContainer
      title="Histórico de Doses"
      description="Listagem completa (do mais recente para o mais antigo) de todas as doses deste tratamento."
      action={
        <Link href={`/treatments/${id}`}>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Voltar ao Tratamento</Button>
        </Link>
      }
    >
      <div className="bg-card rounded-xl border shadow overflow-hidden">
        {doses.length === 0 ? (
          <EmptyState title="Nenhuma dose gerada" message="As doses serão geradas automaticamente quando o tratamento for ativado." />
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Horário Agendado</TableHead>
                <TableHead>Medicamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data da Ação</TableHead>
                <TableHead>Timing</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doses.map((dose) => {
                const actionDate = dose.appliedAt || dose.skippedAt
                return (
                  <TableRow key={dose.id}>
                    <TableCell className="font-medium">{formatDateTime(dose.scheduledFor)}</TableCell>
                    <TableCell>{dose.treatmentItem.medicationName}</TableCell>
                    <TableCell><DoseStatusBadge status={dose.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{actionDate ? formatDateTime(actionDate) : "-"}</TableCell>
                    <TableCell>
                      {dose.applicationTiming === "ON_TIME" && <span className="text-emerald-600 text-xs font-semibold">NO HORÁRIO</span>}
                      {dose.applicationTiming === "LATE" && <span className="text-amber-600 text-xs font-semibold">ATRASADO</span>}
                      {!dose.applicationTiming && "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate" title={dose.note || ""}>{dose.note || "-"}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </PageContainer>
  )
}
