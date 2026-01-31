import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { hasSupabaseConfig, supabase } from '../lib/supabase.js'

const AuthContext = createContext({
  session: null,
  user: null,
  loading: true,
  hasSupabaseConfig: false,
  signInWithPassword: async () => ({ data: null, error: null }),
  signUpWithPassword: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null }),
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false)
      return undefined
    }

    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [hasSupabaseConfig])

  const value = useMemo(() => {
    return {
      session,
      user: session?.user ?? null,
      loading,
      hasSupabaseConfig,
      signInWithPassword: async ({ email, password }) => {
        if (!hasSupabaseConfig || !supabase) {
          return { data: null, error: new Error('Supabase is not configured.') }
        }
        return supabase.auth.signInWithPassword({ email, password })
      },
      signUpWithPassword: async ({ email, password, displayName }) => {
        if (!hasSupabaseConfig || !supabase) {
          return { data: null, error: new Error('Supabase is not configured.') }
        }
        return supabase.auth.signUp({
          email,
          password,
          options: displayName ? { data: { name: displayName } } : undefined,
        })
      },
      signOut: async () => {
        if (!hasSupabaseConfig || !supabase) {
          return { error: null }
        }
        return supabase.auth.signOut()
      },
    }
  }, [session, loading, hasSupabaseConfig])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
