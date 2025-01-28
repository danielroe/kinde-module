import type { H3Event, SessionConfig } from 'h3'
import type { SessionManager } from '@kinde-oss/kinde-typescript-sdk'
import type { CookieSerializeOptions } from 'cookie-es'
import { defineEventHandler } from 'h3'

import { getKindeClient } from '../utils/client'
import type { KindeContext } from '../../types'
import { getSession, updateSession, clearSession, useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const sessionManager = await createSessionManager(event)
  const kindeClient = getKindeClient()
  const kindeContext: KindeContext = {
    sessionManager,
    createOrg: kindeClient.createOrg.bind(kindeClient, sessionManager),
    getBooleanFlag: kindeClient.getBooleanFlag.bind(kindeClient, sessionManager),
    getClaim: kindeClient.getClaim.bind(kindeClient, sessionManager),
    getClaimValue: kindeClient.getClaimValue.bind(kindeClient, sessionManager),
    getFlag: kindeClient.getFlag.bind(kindeClient, sessionManager),
    getIntegerFlag: kindeClient.getIntegerFlag.bind(kindeClient, sessionManager),
    getOrganization: kindeClient.getOrganization.bind(kindeClient, sessionManager),
    getPermission: kindeClient.getPermission.bind(kindeClient, sessionManager),
    getPermissions: kindeClient.getPermissions.bind(kindeClient, sessionManager),
    getStringFlag: kindeClient.getStringFlag.bind(kindeClient, sessionManager),
    getToken: kindeClient.getToken.bind(kindeClient, sessionManager),
    getUser: kindeClient.getUser.bind(kindeClient, sessionManager),
    getUserOrganizations: kindeClient.getUserOrganizations.bind(kindeClient, sessionManager),
    getUserProfile: kindeClient.getUserProfile.bind(kindeClient, sessionManager),
    handleRedirectToApp: kindeClient.handleRedirectToApp.bind(kindeClient, sessionManager),
    isAuthenticated: kindeClient.isAuthenticated.bind(kindeClient, sessionManager),
    login: kindeClient.login.bind(kindeClient, sessionManager),
    logout: kindeClient.logout.bind(kindeClient, sessionManager),
    refreshTokens: kindeClient.refreshTokens.bind(kindeClient, sessionManager),
    register: kindeClient.register.bind(kindeClient, sessionManager),
  }
  event.context.kinde = kindeContext
})

async function createSessionManager(event: H3Event): Promise<SessionManager> {
  // TODO: improve memory session in future
  const keysInCookie = ['refresh_token', 'access_token', 'id_token', 'ac-state-key', 'post-login-redirect-url']
  const memorySession: Record<(typeof keysInCookie)[number], unknown> = {}

  const config = useRuntimeConfig(event)
  const sessionConfig = {
    name: 'kinde',
    cookie: config.kinde.cookie as CookieSerializeOptions,
    password: config.kinde.password,
  } satisfies SessionConfig

  return {
    async getSessionItem(itemKey) {
      const session = await getSession(event, sessionConfig)
      return session.data[itemKey] || memorySession[itemKey]
    },
    async setSessionItem(itemKey, itemValue) {
      if (keysInCookie.includes(itemKey)) {
        await updateSession(event, sessionConfig, {
          [itemKey]: itemValue,
        })
      }
      else {
        memorySession[itemKey] = itemValue
      }
    },
    async removeSessionItem(itemKey) {
      if (keysInCookie.includes(itemKey)) {
        await updateSession(event, sessionConfig, {
          [itemKey]: undefined,
        })
      }
      else {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete memorySession[itemKey]
      }
    },
    async destroySession() {
      for (const key in memorySession) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete memorySession[key]
      }
      await clearSession(event, sessionConfig)
    },
  }
}
