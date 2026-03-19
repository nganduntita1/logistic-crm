import { AuthForm } from '@/components/auth/auth-form'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 17H7A5 5 0 0 1 7 7h2" />
                <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-3">Logistics CRM</h1>
            <p className="text-blue-100 text-lg leading-relaxed">
              Manage your shipments, drivers, and clients from one powerful dashboard.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: '📦', text: 'Real-time shipment tracking' },
              { icon: '🚛', text: 'Driver & vehicle management' },
              { icon: '📊', text: 'Analytics & reports' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-blue-100">
                <span className="text-xl">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Logistics CRM</h1>
            <p className="text-gray-500 mt-1 text-sm">Sign in to your account</p>
          </div>
          <AuthForm mode="sign-in" />
        </div>
      </div>
    </div>
  )
}
