"use client"

import { useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Stethoscope, CheckCircle2, AlertCircle } from "lucide-react"

export default function LandingPage() {
  const { status } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (status === "authenticated") {
    router.push("/dashboard")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      await signIn("nodemailer", { email, redirect: false })
      setSubmitted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-sm">
          <Stethoscope className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">PetMed</h1>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Acesse sua conta</CardTitle>
          <CardDescription>
            Gestão profissional de tratamentos veterinários contínuos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Verifique seu email</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Enviamos um link mágico de acesso para <br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <Button variant="outline" className="mt-4" onClick={() => setSubmitted(false)}>
                Tentar outro email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !email}>
                {loading ? "Enviando..." : "Entrar com link mágico"}
              </Button>
            </form>
          )}
        </CardContent>
        {status === "unauthenticated" && !submitted && (
          <CardFooter className="flex justify-center flex-col gap-2 border-t bg-muted/50 p-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Não é necessária senha.
            </p>
          </CardFooter>
        )}
      </Card>
      
      <p className="mt-12 text-center text-sm text-slate-500 max-w-sm">
        O acompanhamento rigoroso garante a eficácia do tratamento do seu pet.
      </p>
    </div>
  )
}
