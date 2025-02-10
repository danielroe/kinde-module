import type { ACClient, SessionManager, UserType } from '@kinde-oss/kinde-typescript-sdk'

export type AuthState =
  { loggedIn: true, user: UserType } |
  { loggedIn: false, user: null }

export type AccessResponse = {
  access: boolean
  redirectUrl?: string
}

type Slice<T extends Array<unknown>> = T extends [infer _A, ...infer B] ? B : never

export type KindeContext = {
  [key in keyof ACClient]: (
    ...args: Slice<Parameters<ACClient[key]>>
  ) => ReturnType<ACClient[key]>
} & { sessionManager: SessionManager }
