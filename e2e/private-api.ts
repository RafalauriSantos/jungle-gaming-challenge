/** Every API endpoint that needs a session, as the mock registers it. A guard test keeps this list equal to the handlers. */
export const PRIVATE_API: readonly (readonly [method: string, path: string])[] = [
  ['GET', '/api/auth/session'],
  ['GET', '/api/wallets'],
  ['PUT', '/api/wallets/primary'],
  ['PUT', '/api/wallets/secondary'],
  ['POST', '/api/wallet-connections'],
  ['GET', '/api/favorites'],
  ['PUT', '/api/favorites/:nftId'],
  ['DELETE', '/api/favorites/:nftId'],
  ['GET', '/api/profile'],
  ['PATCH', '/api/profile'],
  ['PUT', '/api/profile/avatar'],
  ['DELETE', '/api/profile/avatar'],
  ['POST', '/api/profile/password'],
  ['GET', '/api/cart'],
  ['POST', '/api/cart/items'],
  ['PUT', '/api/cart/items/:nftId/:editionId'],
  ['DELETE', '/api/cart/items/:nftId/:editionId'],
  ['POST', '/api/cart/merge'],
  ['POST', '/api/quotes'],
  ['GET', '/api/quotes/:id'],
  ['POST', '/api/orders'],
  ['GET', '/api/orders'],
  ['GET', '/api/orders/:id'],
]

/** Endpoints that work without a session: the catalog, sign-up, sign-in and sign-out (ending a session twice is harmless). */
export const PUBLIC_API: readonly (readonly [string, string])[] = [
  ['GET', '/api/nfts'],
  ['GET', '/api/nfts/:id'],
  ['POST', '/api/auth/signup'],
  ['POST', '/api/auth/login'],
  ['POST', '/api/auth/logout'],
]
