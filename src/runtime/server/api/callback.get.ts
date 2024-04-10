import { defineEventHandler, getRequestURL, sendRedirect } from 'h3'
import { getKindeClient } from '../utils/client'
import { useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()

export default defineEventHandler(async (event) => {
  await getKindeClient().handleRedirectToApp(
    event.context.kinde!.sessionManager,
    getRequestURL(event),
  )
  await sendRedirect(event, config.kinde.postLoginRedirectURL || '/')
})
