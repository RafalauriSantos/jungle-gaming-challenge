import { delay, HttpResponse } from 'msw'
import type { ErrorBody } from '@/api/types'
import { db } from './db'

// Latency for the `slow` and `out-of-order` scenarios: fixed sequences, not random, so every run of a
// scenario behaves the same. The position in the sequence restarts when the scenario changes.
const SLOW = [1800, 3200, 900, 2400]
const OUT_OF_ORDER = [1800, 500, 100]

let counted: { scenario: string; generation: number; n: number } = { scenario: '', generation: 0, n: 0 }
const applied: number[] = []

function nextFrom(sequence: number[]): number {
  const { scenario, generation } = db.state
  if (counted.scenario !== scenario || counted.generation !== generation) counted = { scenario, generation, n: 0 }
  return sequence[counted.n++ % sequence.length]!
}

/** The delays the network scenarios have applied since the page loaded, in order. */
export const appliedLatencies = () => [...applied]

const failure = (status: number, code: ErrorBody['code'], message: string) => HttpResponse.json({ code, message } satisfies ErrorBody, { status })

/**
 * The network side of a scenario, applied to every API request before its own handler. It either
 * answers instead (offline, 4xx, 5xx), delays and lets the handler answer (slow, out of order), or
 * does nothing. Business scenarios (price changed, wallet refused…) live in their own handlers.
 */
export async function networkScenario(): Promise<Response | undefined> {
  switch (db.state.scenario) {
    case 'offline':
      return HttpResponse.error()
    case 'http-4xx':
      return failure(400, 'validation', 'Requisição inválida (cenário simulado).')
    case 'http-5xx':
      return failure(503, 'transient', 'Serviço indisponível (cenário simulado).')
    case 'slow':
    case 'out-of-order': {
      const ms = nextFrom(db.state.scenario === 'slow' ? SLOW : OUT_OF_ORDER)
      applied.push(ms)
      await delay(ms)
      return undefined
    }
    default:
      return undefined
  }
}
