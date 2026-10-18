// MSW keeps a cookie jar (`tough-cookie`, which carries the whole public-suffix list: about 85 KB of the 143 KB the mock
// layer costs on the wire). The mock never reads or sets cookies: the session travels in a header. This module has the
// three names MSW imports and does nothing, so the jar and its list stay out of the published build.
// If a handler ever needs cookies, remove the alias in `vite.config.ts` and the real library comes back.

export class Cookie {
  key = ''
  domain: string | null = null
  path: string | null = null
  static fromJSON(): Cookie | null {
    return null
  }
  toJSON(): Record<string, unknown> {
    return {}
  }
}

export class MemoryCookieStore {
  idx: Record<string, Record<string, Record<string, Cookie>>> = {}
}

export class CookieJar {
  store?: MemoryCookieStore
  constructor(store?: MemoryCookieStore) {
    this.store = store
  }
  getCookiesSync(): Cookie[] {
    return []
  }
  async setCookie(): Promise<void> {}
}
