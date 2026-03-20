'use client'

import { useEffect } from 'react'

export function PwaProvider() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]'

    const cleanupServiceWorkerState = () => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister()
        })
      })

      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (
              key.startsWith('logistics-crm-') ||
              key.startsWith('workbox-') ||
              key.startsWith('next-')
            ) {
              caches.delete(key)
            }
          })
        })
      }
    }

    const isProduction = process.env.NODE_ENV === 'production'

    // Never allow SW to control local development, even when testing production builds on localhost.
    if (!isProduction || isLocalhost) {
      cleanupServiceWorkerState()
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