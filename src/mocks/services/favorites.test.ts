import { beforeEach, describe, expect, it } from 'vitest'
import { createDb, memoryStorage, type Db } from '../db'
import { addFavorite, listFavorites, removeFavorite } from './favorites'

let db: Db
beforeEach(() => {
  db = createDb(memoryStorage())
})
const id = (n: number) => db.state.nfts[n]!.id

describe('favorites', () => {
  it('FAV-1#1: keeps favorites per user and shows none of them to another user', () => {
    addFavorite(db, 'u_ana', id(0))
    expect(listFavorites(db, 'u_ana')).toEqual({ nftIds: [id(0)] })
    expect(listFavorites(db, 'u_bruno')).toEqual({ nftIds: [] })
  })

  it('FAV-1#1: adding and removing are idempotent', () => {
    addFavorite(db, 'u_ana', id(0))
    addFavorite(db, 'u_ana', id(0))
    expect(listFavorites(db, 'u_ana').nftIds).toEqual([id(0)])
    removeFavorite(db, 'u_ana', id(0))
    removeFavorite(db, 'u_ana', id(0))
    expect(listFavorites(db, 'u_ana').nftIds).toEqual([])
  })

  it('FAV-1#1: refuses an NFT that does not exist', () => {
    expect(() => addFavorite(db, 'u_ana', 'nft_missing')).toThrow(/não encontrado/i)
  })
})
