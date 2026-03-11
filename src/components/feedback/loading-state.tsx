import { Loader2 } from "lucide-react"

export function LoadingState({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8 text-center text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
