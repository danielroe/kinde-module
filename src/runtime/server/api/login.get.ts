import { defineEventHandler, sendRedirect, getQuery } from 'h3'
import { getKindeClient } from '../utils/client'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const { kinde: kindeSettings } = useRuntimeConfig()
  const query: Record<string, string> = getQuery(event)

  const sessionManager = event.context.kinde.sessionManager

  if (query.postLoginRedirectURL) {
    sessionManager.setSessionItem('post-login-redirect-url', query.postLoginRedirectURL)
  }

  const loginURL = await getKindeClient().login(sessionManager, {
    authUrlParams: {
      audience: kindeSettings.audience,
      ...query,
    },
  })
  await sendRedirect(event, loginURL.href)
})
