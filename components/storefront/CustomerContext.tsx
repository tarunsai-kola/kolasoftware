'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// =============================================================================
// Types
// =============================================================================

export interface CustomerAddress {
  id: string
  label: string
  address_line: string
  lat: number | null
  lng: number | null
  is_default: boolean
}

export interface CustomerProfile {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  user_id: string
}

interface CustomerContextValue {
  user: User | null
  customer: CustomerProfile | null
  addresses: CustomerAddress[]
  isLoading: boolean
  isProfileComplete: boolean
  refreshCustomer: () => Promise<void>
  refreshAddresses: () => Promise<void>
  signOut: () => Promise<void>
}

// =============================================================================
// Context
// =============================================================================

const CustomerContext = createContext<CustomerContextValue | null>(null)

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchCustomer = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('customers')
      .select('id, name, phone, email, user_id')
      .eq('user_id', userId)
      .single()
    setCustomer(data ?? null)
  }, [supabase])

  const fetchAddresses = useCallback(async (customerId: string) => {
    const { data } = await supabase
      .from('customer_addresses')
      .select('id, label, address_line, lat, lng, is_default')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
    setAddresses(data ?? [])
  }, [supabase])

  const refreshCustomer = useCallback(async () => {
    if (!user) return
    await fetchCustomer(user.id)
  }, [user, fetchCustomer])

  const refreshAddresses = useCallback(async () => {
    if (!customer) return
    await fetchAddresses(customer.id)
  }, [customer, fetchAddresses])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setCustomer(null)
    setAddresses([])
  }, [supabase])

  // ── Bootstrap: check existing session on mount ────────────────────────────
  useEffect(() => {
    const initSession = async () => {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await fetchCustomer(session.user.id)
      }
      setIsLoading(false)
    }
    initSession()

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchCustomer(session.user.id)
      } else {
        setUser(null)
        setCustomer(null)
        setAddresses([])
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchCustomer])

  // ── Fetch addresses once we have a customer record ────────────────────────
  useEffect(() => {
    if (customer?.id) {
      fetchAddresses(customer.id)
    }
  }, [customer?.id, fetchAddresses])

  const isProfileComplete = Boolean(customer?.name && customer?.phone)

  return (
    <CustomerContext.Provider value={{
      user,
      customer,
      addresses,
      isLoading,
      isProfileComplete,
      refreshCustomer,
      refreshAddresses,
      signOut,
    }}>
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomer() {
  const ctx = useContext(CustomerContext)
  if (!ctx) throw new Error('useCustomer must be used inside <CustomerProvider>')
  return ctx
}
