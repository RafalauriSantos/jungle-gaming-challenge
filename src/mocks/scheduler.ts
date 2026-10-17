import type { Db } from './db'

/**
 * Delayed work of the mock (an order settling, an event being sent). Each job remembers the generation
 * it was created in; after a reset it is cancelled, and if a timer still fired the generation check
 * would stop it. A reset can therefore never leak work into the next run.
 */
export function createScheduler(db: Db) {
  const pending = new Set<ReturnType<typeof setTimeout>>()
  db.onReset(() => {
    pending.forEach(clearTimeout)
    pending.clear()
  })
  return {
    after(ms: number, job: () => void) {
      const generation = db.state.generation
      const timer = setTimeout(() => {
        pending.delete(timer)
        if (db.isCurrent(generation)) job()
      }, ms)
      pending.add(timer)
    },
  }
}
