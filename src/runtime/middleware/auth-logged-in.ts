import type { NitroRouteRules } from 'nitropack'
import type { AccessResponse } from '../types'
import { abortNavigation, createError, defineNuxtRouteMiddleware, navigateTo, useNuxtApp, getRouteRules, useRoute } from '#imports'

function rejectNavigation(statusCode: number, message: string) {
  if (import.meta.server) {
    return createError({
      statusCode,
      message,
    })
  }
  return abortNavigation()
}

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (to.path === from.path && import.meta.client) {
    return
  }
  const nuxt = useNuxtApp()
  const { kinde: kindeConfig } = await getRouteRules({ path: useRoute().path }) as NitroRouteRules

  function denyAccess(redirectURL?: string) {
    if (redirectURL) {
      return navigateTo(redirectURL)
    }
    return rejectNavigation(401, 'You must be logged in to access this page')
  }

  if (import.meta.client) {
    const fetchResult = await $fetch<AccessResponse>('/api/access', {
      method: 'POST',
      body: {
        path: to.path,
      },
    })
    if (!fetchResult.access && fetchResult.redirectUrl) {
      return denyAccess(fetchResult.redirectUrl)
    }
    return
  }

  if (!nuxt.$auth.loggedIn) {
    return denyAccess(kindeConfig?.redirectUrl)
  }

  if (kindeConfig?.permissions) {
    const usersPermissions = await nuxt.ssrContext!.event.context.kinde.getPermissions()

    if (!kindeConfig.permissions.some(item => usersPermissions.permissions.includes(item))) {
      return denyAccess(kindeConfig?.redirectUrl)
    }
  }
})
