import type { AppEvent } from '@/api/events'
import { createDb, memoryStorage } from '../db'
import type { Ctx } from './context'

/** A service context for unit tests: frozen clock, recorded events, delayed jobs run by `advance`. */
export function testContext(storage = memoryStorage()) {
  const db = createDb(storage)
  db.freezeClock('2026-10-17T12:00:00.000Z')
  const events: AppEvent[] = []
  const jobs: { at: number; run: () => void }[] = []
  const ctx: Ctx = {
    db,
    publish: (event) => void events.push(event),
    schedule: (ms, run) => void jobs.push({ at: db.now() + ms, run }),
  }
  const advance = (ms: number) => {
    db.advance(ms)
    for (const job of jobs.filter((j) => j.at <= db.now())) {
      jobs.splice(jobs.indexOf(job), 1)
      job.run()
    }
  }
  return { ctx, db, events, advance, storage }
}
