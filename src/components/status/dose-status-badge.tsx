import { Badge } from "@/components/ui/badge"
import { type DoseStatus, DOSE_STATUS_LABELS } from "@/core/value-objects/dose-status"
import { CheckCircle2, Clock, XCircle, Slash, X } from "lucide-react"

export function DoseStatusBadge({ status }: { status: DoseStatus }) {
  const label = DOSE_STATUS_LABELS[status]

  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 flex gap-1">
          <Clock className="w-3 h-3" /> {label}
        </Badge>
      )
    case "APPLIED":
      return (
        <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 flex gap-1">
          <CheckCircle2 className="w-3 h-3" /> {label}
        </Badge>
      )
    case "MISSED":
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 flex gap-1">
          <XCircle className="w-3 h-3" /> {label}
        </Badge>
      )
    case "SKIPPED":
      return (
        <Badge variant="secondary" className="bg-slate-200 text-slate-800 hover:bg-slate-300 flex gap-1">
          <Slash className="w-3 h-3" /> {label}
        </Badge>
      )
    case "CANCELED":
      return (
        <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-200 flex gap-1">
          <X className="w-3 h-3" /> {label}
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
