'use client'

import { useEffect, useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useCart } from './CartContext'
import { useCustomer, type CustomerAddress } from './CustomerContext'
import { useRestaurantContext } from '@/components/shared/ThemeProvider'
import { createOrder } from '@/app/(storefront)/checkout/actions'
import dynamic from 'next/dynamic'

const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-sm text-gray-400">Loading map...</div>
})

// =============================================================================
// Validation schema
// =============================================================================

const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters'),

    phone: z
      .string()
      .trim()
      .regex(
        /^(\+91[\-\s]?)?[6-9]\d{9}$/,
        'Enter a valid 10-digit Indian mobile number',
      ),

    email: z
      .union([
        z.string().trim().email('Enter a valid email address'),
        z.literal(''),
      ])
      .optional(),

    deliveryType: z.enum(['delivery', 'pickup']),

    address: z.string().trim().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryType === 'delivery') {
      if (!data.address || data.address.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a valid delivery address',
          path: ['address'],
        })
      }
      if (data.lat === undefined || data.lng === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please select a location on the map',
          path: ['lat'],
        })
      }
    }
  })

type FormValues = z.infer<typeof schema>

function formatPrice(price: number): string {
  return `₹${Number.isInteger(price) ? price : price.toFixed(2)}`
}

// =============================================================================
// CheckoutForm
// =============================================================================

export default function CheckoutForm() {
  const router = useRouter()
  const { theme } = useRestaurantContext()
  const { cartEntries, totalPrice, clearCart } = useCart()
  const { customer, addresses } = useCustomer()
  const [isPending, startTransition] = useTransition()

  // Address selection state
  const [showNewAddressMap, setShowNewAddressMap] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)

  useEffect(() => {
    if (cartEntries.length === 0) {
      router.replace('/')
    }
  }, [cartEntries.length, router])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { deliveryType: 'delivery' },
  })

  const deliveryType = watch('deliveryType')
  const isLoading = isSubmitting || isPending

  // ── Sync customer to form ──────────────────────────────────────────────────
  useEffect(() => {
    if (customer && customer.name) {
      if (customer.name) setValue('name', customer.name)
      if (customer.phone) setValue('phone', customer.phone)
      if (customer.email) setValue('email', customer.email)
    } else {
      try {
        const cached = localStorage.getItem('checkout_guest_info')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed.name) setValue('name', parsed.name)
          if (parsed.phone) setValue('phone', parsed.phone)
          if (parsed.email) setValue('email', parsed.email)
        }
      } catch (e) {
        // ignore
      }
    }
  }, [customer, setValue])

  // ── Sync addresses to form ────────────────────────────────────────────────
  useEffect(() => {
    if (deliveryType === 'delivery') {
      if (addresses.length > 0 && !selectedAddressId && !showNewAddressMap) {
        // Auto-select first address if none selected
        const defaultAddr = addresses.find(a => a.is_default) || addresses[0]
        handleSelectAddress(defaultAddr)
      } else if (addresses.length === 0) {
        setShowNewAddressMap(true)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses, deliveryType])

  const handleSelectAddress = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id)
    setValue('address', addr.address_line, { shouldValidate: true })
    setValue('lat', addr.lat!, { shouldValidate: true })
    setValue('lng', addr.lng!, { shouldValidate: true })
    setShowNewAddressMap(false)
  }

  const handleAddNewAddress = () => {
    setSelectedAddressId(null)
    setValue('address', '', { shouldValidate: false })
    setValue('lat', undefined, { shouldValidate: false })
    setValue('lng', undefined, { shouldValidate: false })
    setShowNewAddressMap(true)
  }

  // ── Form submission ────────────────────────────────────────────────────────
  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const toastId = toast.loading('Placing your order…')

      const result = await createOrder(
        {
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          deliveryType: data.deliveryType,
          address: data.address || null,
          lat: data.lat,
          lng: data.lng,
        },
        cartEntries,
      )

      if (!result.success) {
        toast.error(result.error, { id: toastId, duration: 6000 })
        return
      }

      toast.success('Order placed successfully!', { id: toastId, duration: 4000 })
      clearCart()
      router.push('/')
    })
  }

  if (cartEntries.length === 0) {
    return <div className="flex min-h-[60vh] items-center justify-center text-gray-400">Redirecting…</div>
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-10">
      
      {/* ── Left: Form ────────────────────────────────────────────────────── */}
      <form
        id="checkout-form"
        onSubmit={handleSubmit(onSubmit, (errs) => {
          if (Object.values(errs)[0]?.message) toast.error(Object.values(errs)[0]?.message as string)
          else toast.error('Please check the form for errors')
        })}
        noValidate
        className="space-y-6"
      >
        <FormSection title="Your Details">
          <Field label="Full name" htmlFor="name" error={errors.name?.message} required>
            <input
              id="name"
              type="text"
              autoComplete="name"
              disabled={!!customer?.name}
              {...register('name')}
              className={inputClass(!!errors.name, !!customer?.name)}
            />
          </Field>
          <Field label="Phone number" htmlFor="phone" error={errors.phone?.message} required>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">+91</span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                disabled={!!customer?.phone}
                {...register('phone')}
                className={`${inputClass(!!errors.phone, !!customer?.phone)} pl-12`}
              />
            </div>
          </Field>
          <Field label="Email address" htmlFor="email" hint="For order receipts" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={!!customer?.email}
              {...register('email')}
              className={inputClass(!!errors.email, !!customer?.email)}
            />
          </Field>
        </FormSection>

        <FormSection title="Delivery">
          <fieldset>
            <legend className="sr-only">Delivery type</legend>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'delivery', label: '🚚 Delivery', id: 'dt-delivery' },
                { value: 'pickup', label: '🏪 Pickup', id: 'dt-pickup' },
              ].map(({ value, label, id }) => (
                <label
                  key={value}
                  htmlFor={id}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-150"
                  style={
                    deliveryType === value
                      ? { borderColor: 'var(--restaurant-primary)', background: 'var(--restaurant-primary-muted)', color: 'var(--restaurant-primary-dark)' }
                      : { borderColor: '#e5e7eb', background: '#fff', color: '#6b7280' }
                  }
                >
                  <input id={id} type="radio" value={value} {...register('deliveryType')} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {deliveryType === 'delivery' && (
            <div className="space-y-6 pt-4">
              
              {/* Saved Addresses List */}
              {addresses.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Select delivery address</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectAddress(addr)}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                          selectedAddressId === addr.id
                            ? 'border-[var(--restaurant-primary)] bg-[var(--restaurant-primary-muted)]'
                            : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-bold text-gray-900">{addr.label}</span>
                          {addr.is_default && (
                            <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">Default</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{addr.address_line}</p>
                      </div>
                    ))}
                    
                    <div
                      onClick={handleAddNewAddress}
                      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 transition-all duration-200 ${
                        showNewAddressMap
                          ? 'border-[var(--restaurant-primary)] bg-[var(--restaurant-primary-muted)] text-[var(--restaurant-primary-dark)]'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-xl">+</span>
                      <span className="text-sm font-semibold">Add new address</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Map & New Address Input */}
              {showNewAddressMap && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Pinpoint location <span className="text-red-500">*</span></label>
                    <p className="text-xs text-gray-400">Drag the map to set exact delivery spot.</p>
                    <LocationPicker 
                      onLocationSelect={(lat, lng) => {
                        setValue('lat', lat, { shouldValidate: true })
                        setValue('lng', lng, { shouldValidate: true })
                      }}
                    />
                    {errors.lat && (
                      <p className="text-xs font-medium text-red-600 mt-1">⚠ {errors.lat.message}</p>
                    )}
                  </div>

                  <Field label="Complete address" htmlFor="address" hint="House/flat no, landmark, area" error={errors.address?.message} required>
                    <textarea
                      id="address"
                      rows={3}
                      placeholder="e.g. Flat 402, Block B, Near Metro Station..."
                      {...register('address')}
                      className={`${inputClass(!!errors.address)} resize-none`}
                    />
                  </Field>
                </div>
              )}
            </div>
          )}

          {deliveryType === 'pickup' && (
            <div className="flex items-start gap-3 rounded-xl p-4 bg-[var(--restaurant-primary-muted)]">
              <span className="mt-0.5 text-xl">📍</span>
              <div>
                <p className="text-sm font-semibold text-[var(--restaurant-primary-dark)]">Pickup location</p>
                <p className="mt-0.5 text-sm text-gray-700">Contact {theme.name || 'the restaurant'} directly for the pickup address and estimated ready time.</p>
              </div>
            </div>
          )}
        </FormSection>

        <div className="hidden lg:block">
          <SubmitButton isLoading={isLoading} totalPrice={totalPrice} formatPrice={formatPrice} />
        </div>
      </form>

      {/* ── Right: Order Summary ────────────────────────────────────────────── */}
      <aside className="hidden lg:block lg:sticky lg:top-[130px]">
        <OrderSummaryPanel cartEntries={cartEntries} totalPrice={totalPrice} formatPrice={formatPrice} />
      </aside>

      <div className="mt-6 lg:hidden">
        <OrderSummaryPanel cartEntries={cartEntries} totalPrice={totalPrice} formatPrice={formatPrice} />
      </div>

      {/* Mobile submit */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-sm lg:hidden">
        <SubmitButton isLoading={isLoading} totalPrice={totalPrice} formatPrice={formatPrice} formId="checkout-form" />
      </div>
      <div className="h-24 lg:hidden" aria-hidden="true" />
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, htmlFor, hint, error, required, children }: { label: string; htmlFor: string; hint?: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-600">⚠ {error}</p>}
    </div>
  )
}

function SubmitButton({ isLoading, totalPrice, formatPrice, formId }: { isLoading: boolean; totalPrice: number; formatPrice: (p: number) => string; formId?: string }) {
  return (
    <button
      type="submit"
      form={formId}
      disabled={isLoading}
      className="btn-brand w-full py-4 text-base shadow-lg disabled:opacity-60"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">Processing…</span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          Place order (COD)
          <span className="rounded-md bg-white/20 px-2 py-0.5 text-sm font-bold">{formatPrice(totalPrice)}</span>
        </span>
      )}
    </button>
  )
}

import type { CartEntry } from './CartContext'

function OrderSummaryPanel({ cartEntries, totalPrice, formatPrice }: { cartEntries: CartEntry[]; totalPrice: number; formatPrice: (p: number) => string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">Order summary</h2>
        <Link href="/" className="text-xs font-medium text-[var(--restaurant-primary)] underline underline-offset-2">Edit cart</Link>
      </div>
      <ul className="divide-y divide-gray-100" role="list">
        {cartEntries.map((entry) => (
          <li key={entry.cartEntryId} className="flex items-start gap-3 py-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {entry.imageUrl ? <img src={entry.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center">🍴</div>}
            </div>
            <div className="flex flex-1 flex-col min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm text-gray-800">{entry.name} <span className="text-gray-400">×{entry.quantity}</span></span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(entry.price * entry.quantity)}</span>
              </div>
              
              {/* Customizations */}
              {(entry.selectedVariants?.length || entry.selectedAddons?.length) ? (
                <div className="flex flex-col text-[11px] text-gray-500 leading-tight mt-0.5">
                  {entry.selectedVariants?.map(v => (
                    <span key={v.groupId}>{v.groupName}: {v.variantName}</span>
                  ))}
                  {entry.selectedAddons?.map(a => (
                    <span key={a.addonName}>+ {a.addonName}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-baseline justify-between border-t border-gray-100 pt-4">
        <span className="text-sm font-medium text-gray-500">Subtotal</span>
        <span className="text-lg font-extrabold tabular-nums text-[var(--restaurant-primary)]">{formatPrice(totalPrice)}</span>
      </div>
    </div>
  )
}

function inputClass(hasError: boolean, disabled: boolean = false): string {
  return [
    'w-full rounded-xl border px-4 py-3 text-sm transition-all duration-150 outline-none',
    disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200' : 'bg-white text-gray-900 placeholder:text-gray-300 focus:ring-2',
    hasError && !disabled
      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
      : !disabled ? 'border-gray-200 focus:border-[var(--restaurant-primary)] focus:ring-[var(--restaurant-primary-muted)]' : '',
  ].join(' ')
}
