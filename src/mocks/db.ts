import type { Cart, Nft, Order, Profile, Wallets } from '@/api/types'
import { NFT_FIXTURES } from './fixtures/nfts'
import { SEED_PROFILES, SEED_USERS, SEED_WALLETS } from './fixtures/users'

export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  }
}

export interface StoredUser { id: string; username: string; email: string; salt: string; passwordHash: string }
export interface StoredSession { token: string; userId: string; expiresAt: number }
export interface StoredOrder extends Order { userId: string }

/** Everything the mock backend knows. One object, so reset can restore it whole. */
export interface MockState {
  schema: 1
  /** Bumped by every reset; anything scheduled under an older generation is dropped. */
  generation: number
  counters: Record<string, number>
  clock: { fixedAt: number | null; offset: number }
  scenario: string
  nfts: Nft[]
  users: StoredUser[]
  sessions: StoredSession[]
  profiles: Record<string, Profile>
  wallets: Record<string, Wallets>
  carts: Record<string, Cart>
  favorites: Record<string, string[]>
  orders: StoredOrder[]
  idempotency: Record<string, { userId: string; bodyHash: string; orderId: string }>
  merges: Record<string, string[]>
}

const STORAGE_KEY = 'kurio.mock.db'

function initialState(generation: number): MockState {
  return structuredClone({
    schema: 1,
    generation,
    counters: {},
    clock: { fixedAt: null, offset: 0 },
    scenario: 'success',
    nfts: NFT_FIXTURES,
    users: SEED_USERS,
    sessions: [],
    profiles: SEED_PROFILES,
    wallets: SEED_WALLETS,
    carts: {},
    favorites: {},
    orders: [],
    idempotency: {},
    merges: {},
  })
}

export function createDb(storage: KeyValueStorage = memoryStorage()) {
  const load = (): MockState => {
    try {
      const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null') as MockState | null
      if (saved?.schema === 1) return saved
    } catch {
      // Corrupt or foreign data: start from the known scenario.
    }
    return initialState(1)
  }

  let state = load()
  const save = () => storage.setItem(STORAGE_KEY, JSON.stringify(state))

  return {
    get state() {
      return state
    },
    save,
    /** Restores the known scenario completely and invalidates everything scheduled before. */
    reset() {
      state = initialState(state.generation + 1)
      save()
    },
    isCurrent: (generation: number) => generation === state.generation,
    /** Mock time: wall clock (or a frozen instant) plus a controllable offset. */
    now: () => (state.clock.fixedAt ?? Date.now()) + state.clock.offset,
    advance(ms: number) {
      state.clock.offset += ms
      save()
    },
    freezeClock(iso: string) {
      state.clock = { fixedAt: Date.parse(iso), offset: 0 }
      save()
    },
    /** Sequential ids per prefix: `ord_000001`. Deterministic for a given history. */
    nextId(prefix: string) {
      state.counters[prefix] = (state.counters[prefix] ?? 0) + 1
      save()
      return `${prefix}_${String(state.counters[prefix]).padStart(6, '0')}`
    },
  }
}

export type Db = ReturnType<typeof createDb>

export const db = createDb(typeof localStorage === 'undefined' ? memoryStorage() : localStorage)
