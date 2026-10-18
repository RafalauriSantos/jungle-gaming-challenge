import type { Db } from './db'
import { isScenario } from './scenarios'

const KEEP = 'kurio.mock.db'

/**
 * Applies `?reset=1` and `?scenario=<name>` before the app starts, then returns the query string without
 * them so a refresh does not repeat the reset. Reset wipes the mock state and every `kurio.*` key of the
 * app, in local and tab storage; a scenario given alongside applies after it.
 */
export function applyBootParams(
  db: Db,
  search: string,
  storages: { length: number; key(i: number): string | null; removeItem(k: string): void }[],
): { search: string; reset: boolean } {
  const params = new URLSearchParams(search)

  const reset = params.get('reset') === '1'
  if (reset) {
    db.reset()
    // Both the browser's storage and the tab's: the coupon and the checkout draft live in the second.
    for (const storage of storages) {
      const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter((k): k is string => !!k)
      keys.filter((k) => k.startsWith('kurio.') && k !== KEEP).forEach((k) => storage.removeItem(k))
    }
  }
  params.delete('reset')

  const scenario = params.get('scenario')
  if (scenario && isScenario(scenario)) {
    db.state.scenario = scenario
    db.save()
  }
  params.delete('scenario')

  const rest = params.toString()
  return { search: rest ? `?${rest}` : '', reset }
}
