"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export default function NewPetPage() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    weight: "",
    photoUrl: "",
    notes: "",
  })

  if (status === "unauthenticated") {
    router.push("/")
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const payload = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed || undefined,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        photoUrl: formData.photoUrl || undefined,
        notes: formData.notes || undefined,
      }

      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Erro ao criar pet")
      toast({ title: "Sucesso!", description: "Pet cadastrado com sucesso." })
      router.push("/pets")
      router.refresh()
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível cadastrar o pet. Verifique os dados e tente novamente." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer title="Novo Pet" description="Cadastre as informações básicas do seu animal.">
      <Card className="max-w-xl mx-auto mt-6">
        <CardContent className="pt-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="species">Espécie *</Label>
                <Input id="species" name="species" placeholder="Cachorro, Gato..." value={formData.species} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breed">Raça</Label>
                <Input id="breed" name="breed" value={formData.breed} onChange={handleChange} />
              </div>
              <div className="space-y-2 grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="age">Idade</Label>
                  <Input id="age" name="age" type="number" value={formData.age} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input id="weight" name="weight" type="number" step="0.1" value={formData.weight} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photoUrl">URL da Foto (opcional)</Label>
              <Input id="photoUrl" name="photoUrl" type="url" value={formData.photoUrl} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" name="notes" placeholder="Alergias, histórico médico..." value={formData.notes} onChange={handleChange} />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit" disabled={loading || !formData.name || !formData.species}>
                {loading ? "Salvando..." : "Salvar Pet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
