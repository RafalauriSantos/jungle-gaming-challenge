import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { control } from './control'
import { SCENARIOS } from './scenarios'

/** Lets anyone try a failure scenario or start over, on the deployed demo as well. */
function MockPanel() {
  const [open, setOpen] = useState(false)
  const [scenario, setScenario] = useState<string>(control.scenario())
  return (
    <div className="fixed bottom-24 left-3 z-40 md:bottom-3">
      <Button size="sm" variant="outline" aria-expanded={open} aria-controls="mock-panel" onClick={() => setOpen((o) => !o)} className="bg-ink">
        Demo
      </Button>
      {open && (
        <div id="mock-panel" role="region" aria-label="Painel de demonstração" className="mt-2 w-72 rounded-lg border border-border bg-surface-card p-3 text-sm shadow-lg">
          <p className="mb-3 text-xs text-text-secondary">Backend simulado (MSW). O cenário vale até você trocá-lo ou resetar.</p>
          <div className="mb-3 flex flex-col gap-1.5">
            <Label htmlFor="mock-scenario">Cenário</Label>
            <Select
              value={scenario}
              onValueChange={(name) => {
                if (!name) return
                control.setScenario(name)
                setScenario(name)
              }}
            >
              <SelectTrigger id="mock-scenario">
                <SelectValue>{(v: string) => SCENARIOS.find((s) => s.name === v)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SCENARIOS.map((s) => (
                  <SelectItem key={s.name} value={s.name} disabled={!s.ready}>
                    {s.label}
                    {s.ready ? '' : ' (em breve)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" variant="outline" onClick={control.reset}>
            Resetar estado
          </Button>
        </div>
      )}
    </div>
  )
}

export function mountMockPanel() {
  const host = document.createElement('div')
  document.body.append(host)
  createRoot(host).render(<MockPanel />)
}
