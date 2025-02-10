import { defineEventHandler, readBody } from 'h3'
import type { NitroRouteRules } from 'nitropack'
import type { AccessResponse } from '../../types'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event): Promise<AccessResponse> => {
  const { kinde: kindeSettings, ...rest } = useRuntimeConfig()
  const body = await readBody(event)

  const routeRules: NitroRouteRules['kinde'] = rest.nitro?.routeRules?.[body.path]?.kinde

  if (!routeRules) {
    return {
      access: true,
    }
  }

  const usersPermissions = await event.context.kinde.getPermissions()
  const isAuthenticaded = await event.context.kinde.isAuthenticated()

  if (!isAuthenticaded || (routeRules.permissions && !usersPermissions.permissions)) {
    return {
      access: false,
      redirectUrl: routeRules.redirectUrl,
    }
  }

  if (!routeRules.permissions?.some((item: string) => usersPermissions.permissions.includes(item))) {
    return {
      access: false,
      redirectUrl: routeRules.redirectUrl,
    }
  }

  return {
    access: true,
  }
})
