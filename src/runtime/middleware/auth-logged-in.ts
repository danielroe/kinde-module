import {
  abortNavigation,
  createError,
  defineNuxtRouteMiddleware,
  navigateTo,
  useNuxtApp,
} from '#imports'
import { getKindeClient } from '../server/utils/client';
import type { KindeRouteRules } from '../types';

function rejectNavigation(status: number, message: string) {
  if (import.meta.server) {
    return createError({
      statusCode: 401,
      message: 'You must be logged in to access this page',
    })
  }
  return abortNavigation()
}

export default defineNuxtRouteMiddleware(async() => {
  const nuxt = useNuxtApp();
  const kindeConfig: KindeRouteRules = nuxt.ssrContext?.event.context._nitro.routeRules.kinde;

  if (!nuxt.$auth.loggedIn) {
    if (kindeConfig.redirectUrl) {
      return navigateTo(kindeConfig.redirectUrl)
    }
    return rejectNavigation(401, 'You must be logged in to access this page')
  }

  if (kindeConfig?.permissions) {
    const kinde = getKindeClient()

      const accessPermissions = kindeConfig.permissions
      const usersPermissions = await kinde.getPermissions(nuxt.ssrContext?.event.context.kinde.sessionManager!);
      const hasCommonValue = accessPermissions?.some(item => usersPermissions.permissions.includes(item)) || false;

      if (!hasCommonValue) {
        if (kindeConfig.redirectUrl) {
          return navigateTo(kindeConfig.redirectUrl)
        }
        return rejectNavigation(401, 'You must be logged in to access this page')
      }
    }

})
