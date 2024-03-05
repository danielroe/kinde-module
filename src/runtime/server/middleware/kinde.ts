import type { H3Event, SessionConfig } from 'h3'
import type { ACClient, SessionManager } from '@kinde-oss/kinde-typescript-sdk'
import type { CookieSerializeOptions } from 'cookie-es'
import { defineEventHandler } from 'h3'

import { getKindeClient } from '../utils/client'
import { getSession, updateSession, clearSession } from '#imports'

export default defineEventHandler(async event => {
  const sessionManager = await createSessionManager(event)
  const kindeContext = { sessionManager } as Record<string, any>
  const kindeClient = getKindeClient()
  for (const _key in kindeClient) {
    const key = _key as keyof typeof kindeClient
    kindeContext[key] = (kindeClient[key] as any).bind(kindeClient, sessionManager)
  }
  event.context.kinde = kindeContext as any
})

async function createSessionManager (event: H3Event): Promise<SessionManager> {
  // TODO: improve memory session in future
  const keysInCookie = ['refresh_token', 'access_token', 'ac-state-key']
  const memorySession: Record<(typeof keysInCookie)[number], unknown> = {}

  const config = useRuntimeConfig(event)
  const sessionConfig = {
    name: 'kinde',
    cookie: config.kinde.cookie as CookieSerializeOptions,
    password: config.kinde.password,
  } satisfies SessionConfig

  return {
    async getSessionItem (itemKey) {
      const session = await getSession(event, sessionConfig)
      return session.data[itemKey] || memorySession[itemKey]
    },
    async setSessionItem (itemKey, itemValue) {
      if (keysInCookie.includes(itemKey)) {
        await updateSession(event, sessionConfig, {
          [itemKey]: itemValue,
        })
      } else {
        memorySession[itemKey] = itemValue
      }
    },
    async removeSessionItem (itemKey) {
      if (keysInCookie.includes(itemKey)) {
        await updateSession(event, sessionConfig, {
          [itemKey]: undefined,
        })
      } else {
        delete memorySession[itemKey]
      }
    },
    async destroySession () {
      for (const key in memorySession) {
        delete memorySession[key]
      }
      await clearSession(event, sessionConfig)
    },
  }
}

type Slice<T extends Array<any>> = T extends [infer _A, ...infer B] ? B : never

declare module 'h3' {
  interface H3EventContext {
    kinde: {
      [key in keyof ACClient]: (
        ...args: Slice<Parameters<ACClient[key]>>
      ) => ReturnType<ACClient[key]>
    } & { sessionManager: SessionManager }
  }
}
