"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Plus, Trash2, CalendarDays, Pill } from "lucide-react"
import { ADMINISTRATION_ROUTE_LABELS } from "@/core/value-objects/administration-route"
import { TARGET_SIDE_LABELS } from "@/core/value-objects/target-side"

type PetOption = { id: string; name: string }

function TreatmentForm() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultPetId = searchParams.get("petId") || ""
  
  const [pets, setPets] = useState<PetOption[]>([])
  const [loading, setLoading] = useState(false)
  
  const [petId, setPetId] = useState(defaultPetId)
  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState("")
  
  const [items, setItems] = useState<any[]>([{
    medicationName: "",
    administrationRoute: "OPHTHALMIC",
    targetSide: "NONE",
    dosageAmount: 1,
    dosageUnit: "gota(s)",
    recurrenceType: "INTERVAL",
    intervalHours: 8,
    fixedTimes: [{ timeOfDay: "08:00", orderIndex: 0 }],
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    instructions: "",
    toleranceWindowMins: 60,
  }])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/pets")
      .then(res => res.json())
      .then(data => {
        setPets(data)
        if (!petId && data.length > 0) setPetId(data[0].id)
      })
  }, [status, petId])

  const handleAddItem = () => {
    setItems([...items, {
      medicationName: "",
      administrationRoute: "OPHTHALMIC",
      targetSide: "NONE",
      dosageAmount: 1,
      dosageUnit: "gota(s)",
      recurrenceType: "INTERVAL",
      intervalHours: 8,
      fixedTimes: [{ timeOfDay: "08:00", orderIndex: 0 }],
      startDate: startDate,
      endDate: "",
      instructions: "",
      toleranceWindowMins: 60,
    }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return toast({ title: "Ops", description: "O tratamento deve ter pelo menos um medicamento." })
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const addFixedTime = (index: number) => {
    const newItems = [...items]
    const item = newItems[index]
    item.fixedTimes.push({ timeOfDay: "12:00", orderIndex: item.fixedTimes.length })
    setItems(newItems)
  }

  const removeFixedTime = (itemIdx: number, timeIdx: number) => {
    const newItems = [...items]
    if (newItems[itemIdx].fixedTimes.length === 1) return
    newItems[itemIdx].fixedTimes = newItems[itemIdx].fixedTimes.filter((_: any, i: number) => i !== timeIdx)
    setItems(newItems)
  }

  const updateFixedTime = (itemIdx: number, timeIdx: number, val: string) => {
    const newItems = [...items]
    newItems[itemIdx].fixedTimes[timeIdx].timeOfDay = val
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        petId,
        title,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        items: items.map(t => ({
          ...t,
          startDate: new Date(t.startDate).toISOString(),
          endDate: t.endDate ? new Date(t.endDate).toISOString() : undefined,
          dosageAmount: Number(t.dosageAmount),
          intervalHours: t.recurrenceType === "INTERVAL" ? Number(t.intervalHours) : undefined,
          fixedTimes: t.recurrenceType === "FIXED_TIMES" ? t.fixedTimes.map((ft: any, i: number) => ({ timeOfDay: ft.timeOfDay, orderIndex: i })) : undefined,
          toleranceWindowMins: Number(t.toleranceWindowMins),
        }))
      }

      const res = await fetch("/api/treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro")
      }
      
      const created = await res.json()
      toast({ title: "Sucesso!", description: "Tratamento criado com sucesso em Rascunho." })
      router.push(`/treatments/${created.id}`)
      router.refresh()
    } catch (err) {
      toast({ variant: "destructive", title: "Erro na criação", description: "Verifique todos os campos." })
    } finally {
      setLoading(false)
    }
  }

  if (status === "unauthenticated") {
    router.push("/")
    return null
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Dados Gerais do Tratamento</CardTitle>
          <CardDescription>Nome, pet e período desse episódio clínico.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Pet *</Label>
            <Select value={petId} onChange={e => setPetId(e.target.value)} required>
              <option value="" disabled>Selecione um pet</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Título do Tratamento *</Label>
            <Input placeholder="Ex: Tratamento Úlcera de Córnea" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Data de Início *</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Data de Fim (Opcional)</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" /> Medicamentos (Mínimo 1)
        </h3>
        
        {items.map((item, index) => (
          <Card key={index} className="border-l-4 border-l-primary/60 shadow-sm relative">
            <Button type="button" variant="ghost" className="absolute right-4 top-4 text-destructive hover:bg-destructive/10" size="sm" onClick={() => handleRemoveItem(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-primary">Medicamento {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome do Medicamento *</Label>
                <Input required placeholder="Ex: Tobramicina" value={item.medicationName} onChange={e => updateItem(index, 'medicationName', e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <Label>Via de Administração</Label>
                <Select value={item.administrationRoute} onChange={e => updateItem(index, 'administrationRoute', e.target.value)}>
                  {Object.entries(ADMINISTRATION_ROUTE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </div>

              <div className="space-y-2 border border-slate-100 p-2 rounded-md bg-slate-50 grid grid-cols-2 gap-2">
                <div>
                  <Label>Lado alvo</Label>
                  <Select value={item.targetSide} onChange={e => updateItem(index, 'targetSide', e.target.value)}>
                    {Object.entries(TARGET_SIDE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </div>
                <div className="flex gap-2">
                  <div className="w-16">
                    <Label>Dose</Label>
                    <Input type="number" step="1" required value={item.dosageAmount} onChange={e => updateItem(index, 'dosageAmount', e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <Label>Unidade</Label>
                    <Input required placeholder="gota(s)" value={item.dosageUnit} onChange={e => updateItem(index, 'dosageUnit', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 md:col-span-2 border-t pt-4">
                <Label className="text-base font-semibold">Regra de Recorrência</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={item.recurrenceType} onChange={e => updateItem(index, 'recurrenceType', e.target.value)}>
                      <option value="INTERVAL">Intervalo em horas (ex: de 8h em 8h)</option>
                      <option value="FIXED_TIMES">Horários fixos no dia (ex: 08:00, 20:00)</option>
                    </Select>
                  </div>
                  
                  {item.recurrenceType === "INTERVAL" ? (
                    <div className="space-y-2">
                      <Label>A cada quantas horas? *</Label>
                      <Input type="number" min="1" max="72" required={item.recurrenceType === "INTERVAL"} value={item.intervalHours} onChange={e => updateItem(index, 'intervalHours', e.target.value)} />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="flex justify-between items-center">
                        Horários * 
                        <Button type="button" variant="outline" size="sm" onClick={() => addFixedTime(index)}> + Adicionar </Button>
                      </Label>
                      {item.fixedTimes.map((ft: any, ftIdx: number) => (
                        <div key={ftIdx} className="flex gap-2 items-center">
                          <Input type="time" required value={ft.timeOfDay} onChange={e => updateFixedTime(index, ftIdx, e.target.value)} />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeFixedTime(index, ftIdx)} className="text-muted-foreground"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 md:col-span-2 border-t pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Início (diferente?)</Label>
                  <Input type="date" value={item.startDate} onChange={e => updateItem(index, 'startDate', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Fim (Opcional)</Label>
                  <Input type="date" value={item.endDate} onChange={e => updateItem(index, 'endDate', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tolerância (min)</Label>
                  <Input type="number" min="5" placeholder="60" value={item.toleranceWindowMins} onChange={e => updateItem(index, 'toleranceWindowMins', e.target.value)} required />
                </div>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Instruções (Opcional)</Label>
                <Textarea placeholder="Agitar antes de usar..." value={item.instructions} onChange={e => updateItem(index, 'instructions', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button type="button" variant="outline" className="w-full border-dashed py-8" onClick={handleAddItem}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar outro medicamento
        </Button>
      </div>

      <div className="flex justify-end pt-8">
        <Button type="submit" size="lg" disabled={loading || !title || !petId}>
          {loading ? "Salvando Rascunho..." : "Criar Rascunho do Tratamento"}
        </Button>
      </div>
    </form>
  )
}

export default function NewTreatmentPage() {
  return (
    <PageContainer title="Novo Tratamento" description="Crie um plano de tratamento rigoroso escolhendo pet e informando os itens.">
      <Suspense fallback={<p>Carregando formulário...</p>}>
        <TreatmentForm />
      </Suspense>
    </PageContainer>
  )
}
