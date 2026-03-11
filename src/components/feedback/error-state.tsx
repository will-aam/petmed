import { AlertTriangle } from "lucide-react"

export function ErrorState({ 
  title = "Ocorreu um erro", 
  message = "Não foi possível carregar os dados. Tente novamente mais tarde." 
}: { 
  title?: string
  message?: string
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl p-8 text-center text-destructive bg-destructive/5 animate-in fade-in-50">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="mt-6 text-lg font-semibold">{title}</h3>
      <p className="mb-4 mt-2 text-sm max-w-sm text-destructive/80">{message}</p>
    </div>
  )
}
