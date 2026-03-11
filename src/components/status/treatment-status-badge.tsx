import { Badge } from "@/components/ui/badge"
import { type TreatmentStatus, TREATMENT_STATUS_LABELS } from "@/core/value-objects/treatment-status"

export function TreatmentStatusBadge({ status }: { status: TreatmentStatus }) {
  const label = TREATMENT_STATUS_LABELS[status]

  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">{label}</Badge>
    case "ACTIVE":
      return <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-200">{label}</Badge>
    case "PAUSED":
      return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">{label}</Badge>
    case "COMPLETED":
      return <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">{label}</Badge>
    case "CANCELED":
      return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200">{label}</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
