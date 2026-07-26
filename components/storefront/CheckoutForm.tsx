'use client'

import { useEffect, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useCart } from './CartContext'
import { useRestaurantContext } from '@/components/shared/ThemeProvider'
import { createOrder } from '@/app/(storefront)/checkout/actions'

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
        'Enter a valid 10-digit Indian mobile number (e.g. 9876543210 or +919876543210)',
      ),

    email: z
      .union([
        z.string().trim().email('Enter a valid email address'),
        z.literal(''),
      ])
      .optional(),

    deliveryType: z.enum(['delivery', 'pickup']),

    address: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.deliveryType === 'delivery' &&
      (!data.address || data.address.trim().length < 10)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter your full delivery address (minimum 10 characters)',
        path: ['address'],
      })
    }
  })

type FormValues = z.infer<typeof schema>

// =============================================================================
// Helpers
// =============================================================================

function formatPrice(price: number): string {
  return `₹${Number.isInteger(price) ? price : price.toFixed(2)}`
}

// =============================================================================
// CheckoutForm
// =============================================================================

/**
 * Full checkout form — reads cart from CartContext, validates with Zod,
 * calls the createOrder server action, and redirects to the payment page.
 *
 * Empty-cart redirect: if the user lands here with no items, they are
 * sent back to the storefront immediately.
 */
export default function CheckoutForm() {
  const router = useRouter()
  const { theme } = useRestaurantContext()
  const { cartEntries, totalPrice, clearCart } = useCart()
  const [isPending, startTransition] = useTransition()

  // Redirect to home if cart is empty (handles direct URL access)
  useEffect(() => {
    if (cartEntries.length === 0) {
      router.replace('/')
    }
  }, [cartEntries.length, router])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { deliveryType: 'delivery' },
  })

  const deliveryType = watch('deliveryType')
  const isLoading = isSubmitting || isPending

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
        },
        cartEntries,
      )

      if (!result.success) {
        toast.error(result.error, {
          id: toastId,
          duration: 6000,
        })
        return
      }

      toast.success('Order placed! Taking you to payment…', {
        id: toastId,
        duration: 2000,
      })

      clearCart()
      router.push(`/payment/${result.orderId}`)
    })
  }

  // Show loading skeleton while redirect is happening
  if (cartEntries.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-400">Redirecting…</p>
      </div>
    )
  }

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    // Two-column grid on desktop; single column on mobile
    <div className="mx-auto max-w-5xl px-4 py-8 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-10">

      {/* ── Left: Form ────────────────────────────────────────────────────── */}
      <form
        id="checkout-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-6"
      >

        {/* ── Section: Your Details ────────────────────────────────────────── */}
        <FormSection title="Your Details">
          {/* Full name */}
          <Field
            label="Full name"
            htmlFor="name"
            error={errors.name?.message}
            required
          >
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Rahul Sharma"
              {...register('name')}
              className={inputClass(!!errors.name)}
            />
          </Field>

          {/* Phone */}
          <Field
            label="Phone number"
            htmlFor="phone"
            error={errors.phone?.message}
            required
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                +91
              </span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="9876543210"
                {...register('phone')}
                className={`${inputClass(!!errors.phone)} pl-12`}
              />
            </div>
          </Field>

          {/* Email — optional */}
          <Field
            label="Email address"
            htmlFor="email"
            hint="We'll send your order confirmation here"
            error={errors.email?.message}
          >
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="rahul@example.com"
              {...register('email')}
              className={inputClass(!!errors.email)}
            />
          </Field>
        </FormSection>

        {/* ── Section: Delivery ─────────────────────────────────────────────── */}
        <FormSection title="Delivery">
          {/* Delivery / Pickup toggle */}
          <fieldset>
            <legend className="sr-only">Delivery type</legend>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: 'delivery', label: '🚚 Delivery', id: 'dt-delivery' },
                  { value: 'pickup', label: '🏪 Pickup', id: 'dt-pickup' },
                ] as const
              ).map(({ value, label, id }) => (
                <label
                  key={value}
                  htmlFor={id}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-150"
                  style={
                    deliveryType === value
                      ? ({
                          borderColor: 'var(--restaurant-primary)',
                          background: 'var(--restaurant-primary-muted)',
                          color: 'var(--restaurant-primary-dark)',
                        } as CSSProperties)
                      : {
                          borderColor: '#e5e7eb',
                          background: '#fff',
                          color: '#6b7280',
                        }
                  }
                >
                  <input
                    id={id}
                    type="radio"
                    value={value}
                    {...register('deliveryType')}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Address — shown only for delivery */}
          {deliveryType === 'delivery' && (
            <Field
              label="Delivery address"
              htmlFor="address"
              hint="Adding a landmark helps our delivery partner find you faster"
              error={errors.address?.message}
              required
            >
              <textarea
                id="address"
                rows={3}
                placeholder="House / flat number, street name, area, city — include a landmark"
                {...register('address')}
                className={`${inputClass(!!errors.address)} resize-none leading-relaxed`}
              />
            </Field>
          )}

          {/* Pickup info — shown when pickup is selected */}
          {deliveryType === 'pickup' && (
            <div
              className="flex items-start gap-3 rounded-xl p-4"
              style={{ background: 'var(--restaurant-primary-muted)' }}
            >
              <span className="mt-0.5 text-xl">📍</span>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'var(--restaurant-primary-dark)' }}
                >
                  Pickup location
                </p>
                <p className="mt-0.5 text-sm text-gray-600">
                  {/* TODO: replace with restaurant.pickup_address once that column is added */}
                  Contact {theme.name || 'the restaurant'} directly for the pickup address and estimated ready time.
                </p>
              </div>
            </div>
          )}
        </FormSection>

        {/* ── Desktop submit ─────────────────────────────────────────────────── */}
        {/* On mobile this is hidden — the sticky footer below handles it */}
        <div className="hidden lg:block">
          <SubmitButton
            isLoading={isLoading}
            totalPrice={totalPrice}
            formatPrice={formatPrice}
          />
        </div>
      </form>

      {/* ── Right: Order Summary (desktop sidebar) ─────────────────────────── */}
      <aside className="hidden lg:block lg:sticky lg:top-[130px]">
        <OrderSummaryPanel
          cartEntries={cartEntries}
          totalPrice={totalPrice}
          formatPrice={formatPrice}
        />
      </aside>

      {/* ── Mobile: order summary above the submit ─────────────────────────── */}
      <div className="mt-6 lg:hidden">
        <OrderSummaryPanel
          cartEntries={cartEntries}
          totalPrice={totalPrice}
          formatPrice={formatPrice}
        />
      </div>

      {/* ── Mobile sticky footer ────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-sm lg:hidden">
        <SubmitButton
          isLoading={isLoading}
          totalPrice={totalPrice}
          formatPrice={formatPrice}
          formId="checkout-form"
        />
      </div>

      {/* Spacer so sticky footer doesn't cover last form field on mobile */}
      <div className="h-24 lg:hidden" aria-hidden="true" />
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

// ── Form section wrapper ──────────────────────────────────────────────────────

function FormSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  )
}

// ── Labelled form field with error + hint ─────────────────────────────────────

function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-red-600" role="alert">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}

// ── Submit button ─────────────────────────────────────────────────────────────

function SubmitButton({
  isLoading,
  totalPrice,
  formatPrice,
  formId,
}: {
  isLoading: boolean
  totalPrice: number
  formatPrice: (p: number) => string
  formId?: string
}) {
  return (
    <button
      type="submit"
      form={formId}
      disabled={isLoading}
      className="btn-brand w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
      aria-label={`Place order — total ${formatPrice(totalPrice)}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner />
          Placing order…
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          Place order
          <span className="rounded-md bg-white/20 px-2 py-0.5 text-sm font-bold">
            {formatPrice(totalPrice)}
          </span>
        </span>
      )}
    </button>
  )
}

// ── Order summary panel ───────────────────────────────────────────────────────

import type { CartEntry } from './CartContext'

function OrderSummaryPanel({
  cartEntries,
  totalPrice,
  formatPrice,
}: {
  cartEntries: CartEntry[]
  totalPrice: number
  formatPrice: (p: number) => string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">Order summary</h2>
        <Link
          href="/"
          className="text-xs font-medium underline underline-offset-2"
          style={{ color: 'var(--restaurant-primary)' }}
        >
          Edit cart
        </Link>
      </div>

      <ul className="divide-y divide-gray-100" role="list">
        {cartEntries.map((entry) => (
          <li
            key={entry.menuItemId}
            className="flex items-start gap-3 py-3"
          >
            {/* Thumbnail */}
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {entry.imageUrl ? (
                <img
                  src={entry.imageUrl}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm">
                  🍴
                </div>
              )}
            </div>

            {/* Name + qty */}
            <div className="flex flex-1 items-baseline justify-between gap-2 min-w-0">
              <span className="truncate text-sm text-gray-800">
                {entry.name}
                <span className="ml-1.5 text-gray-400">×{entry.quantity}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-gray-900 tabular-nums">
                {formatPrice(entry.price * entry.quantity)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Subtotal */}
      <div
        className="mt-4 flex items-baseline justify-between border-t border-gray-100 pt-4"
      >
        <span className="text-sm font-medium text-gray-500">Subtotal</span>
        <span
          className="text-lg font-extrabold tabular-nums"
          aria-live="polite"
          style={{ color: 'var(--restaurant-primary)' }}
        >
          {formatPrice(totalPrice)}
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Delivery charges and taxes calculated at checkout.
      </p>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ── Input class factory ───────────────────────────────────────────────────────

function inputClass(hasError: boolean): string {
  return [
    'w-full rounded-xl border px-4 py-3 text-sm text-gray-900',
    'placeholder:text-gray-300',
    'transition-all duration-150 outline-none',
    'focus:ring-2',
    hasError
      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-[var(--restaurant-primary)] focus:ring-[var(--restaurant-primary-muted)]',
  ].join(' ')
}
