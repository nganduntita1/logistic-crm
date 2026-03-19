'use client'

import { useEffect } from 'react'

export function PwaProvider() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    const isProduction = process.env.NODE_ENV === 'production'

    if (!isProduction) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister()
        })
      })

      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (key.startsWith('logistics-crm-')) {
              caches.delete(key)
            }
          })
        })
      }

      return
    }

    const isSecureContext =
      window.location.protocol === 'https:' || window.location.hostname === 'localhost'

    if (!isSecureContext) {
      return
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration failure should not block the app.
    })
  }, [])

  return null
}