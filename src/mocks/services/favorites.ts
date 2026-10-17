import type { Db } from '../db'
import { fail } from '../failure'

export const listFavorites = (db: Db, userId: string): { nftIds: string[] } => ({ nftIds: [...(db.state.favorites[userId] ?? [])] })

function requireNft(db: Db, nftId: string) {
  if (!db.state.nfts.some((n) => n.id === nftId)) throw fail(404, 'not_found', 'NFT não encontrado.')
}

export function addFavorite(db: Db, userId: string, nftId: string) {
  requireNft(db, nftId)
  const ids = (db.state.favorites[userId] ??= [])
  if (!ids.includes(nftId)) ids.push(nftId)
  db.save()
}

export function removeFavorite(db: Db, userId: string, nftId: string) {
  const ids = db.state.favorites[userId]
  if (ids) db.state.favorites[userId] = ids.filter((id) => id !== nftId)
  db.save()
}
