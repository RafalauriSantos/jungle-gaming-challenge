// The session, the account, the wallets and the profile. The source of truth is ARCHITECTURE.md §2.

import type { Network, Provider } from './common'

// --- session and account

export interface User {
  id: string
  username: string
  email: string
}

export interface Session {
  token: string
  expiresAt: string
}

export interface AuthResponse {
  user: User
  session: Session
}

export interface SignupInput {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginInput {
  email: string
  password: string
}

// --- wallets and profile

export interface WalletInput {
  displayName: string
  nickname: string
  network: Network
  profileName: string
  address: string
  ensOrSecondary?: string
  walletType: Provider
  referralCode: string
  email: string
  /** Required on Ethereum only. */
  ensName?: string
}

export interface Wallet extends WalletInput {
  id: string
  version: number
}

export interface Wallets {
  primary: Wallet | null
  secondary: Wallet | null
}

export type ProfileInput = Partial<Pick<Profile, 'displayName' | 'username' | 'email' | 'ensName' | 'walletNickname'>>

export interface PasswordInput {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export interface Profile {
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
  avatarUrl: string | null
  version: number
}
