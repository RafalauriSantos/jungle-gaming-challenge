import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDb, memoryStorage } from './db'
import { createScheduler } from './scheduler'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('scheduler', () => {
  it('runs what was scheduled once its time comes', () => {
    const db = createDb(memoryStorage())
    const run = vi.fn()
    createScheduler(db).after(1000, run)
    vi.advanceTimersByTime(999)
    expect(run).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(run).toHaveBeenCalledOnce()
  })

  it('MOCK-13#1: nothing scheduled before a reset ever runs afterwards', () => {
    const db = createDb(memoryStorage())
    const scheduler = createScheduler(db)
    const stale = vi.fn()
    scheduler.after(1000, stale)
    db.reset()
    vi.advanceTimersByTime(5000)
    expect(stale).not.toHaveBeenCalled()

    const fresh = vi.fn()
    scheduler.after(1000, fresh)
    vi.advanceTimersByTime(1000)
    expect(fresh).toHaveBeenCalledOnce()
  })

  it('drops a callback whose generation went stale even if its timer survived', () => {
    const db = createDb(memoryStorage())
    const run = vi.fn()
    // A second scheduler is not told about the reset, so only the generation check can stop it.
    createScheduler(db).after(1000, run)
    db.state.generation += 1
    vi.advanceTimersByTime(1000)
    expect(run).not.toHaveBeenCalled()
  })
})
