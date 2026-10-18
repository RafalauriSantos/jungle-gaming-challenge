import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { control } from './control'
import { SCENARIOS } from './scenarios'

const HINT_KEY = 'kurio.demo-hint-seen'

/** True on the first visit only: the tab pulses a few times, once, to say it exists. Storage may be blocked; then it stays quiet. */
function useFirstVisitHint() {
  const [hint] = useState(() => {
    try {
      return localStorage.getItem(HINT_KEY) === null
    } catch {
      return false
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(HINT_KEY, '1')
    } catch {
      // Nothing to remember it with; the hint simply shows again next time.
    }
  }, [])
  return hint
}

/** Lets anyone try a failure scenario or start over, on the deployed demo as well. A tab on the left edge opens it. */
function MockPanel() {
  const [open, setOpen] = useState(false)
  const [scenario, setScenario] = useState<string>(control.scenario())
  const hint = useFirstVisitHint()
  return (
    <div className="fixed bottom-40 left-0 z-40 flex items-end md:bottom-6" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mock-panel"
        data-hint={hint}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-0.5 rounded-r-md border border-l-0 border-border bg-ink px-1 py-2 text-[11px] text-text-secondary outline-none transition-colors hover:bg-surface-raised hover:text-text-accent focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:text-text-accent data-[hint=true]:motion-safe:animate-[pulse_1.4s_ease-in-out_2]"
      >
        <ChevronRight aria-hidden className={`size-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        <span className="[writing-mode:vertical-rl]">Demo</span>
      </button>
      {open && (
        <div id="mock-panel" role="region" aria-label="Painel de demonstração" className="ml-2 w-72 max-w-[calc(100vw-3rem)] rounded-lg border border-border bg-surface-card p-3 text-sm shadow-lg">
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
