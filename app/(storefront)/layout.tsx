import type { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import { CartProvider } from '@/components/storefront/CartContext'
import { CustomerProvider } from '@/components/storefront/CustomerContext'

/**
 * Storefront layout — wraps all customer-facing pages:
 *   /           (menu + cart drawer)
 *   /checkout   (checkout form)
 *
 * Responsibility chain:
 *   middleware.ts  →  x-restaurant-id + x-restaurant-theme headers
 *   ThemeProvider  →  CSS custom properties + restaurant React context
 *   CartProvider   →  in-memory cart state shared across /menu and /checkout
 *   Toaster        →  react-hot-toast notifications for the whole storefront
 */
export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode
}) {
  const { restaurantId, theme } = await getRestaurantContext()

  return (
    <ThemeProvider restaurantId={restaurantId} theme={theme}>
      <CustomerProvider>
        <CartProvider>
          {children}

        {/*
          Toaster — uses CSS variables so font and color match the restaurant.
          Positioned bottom-center to avoid clashing with the cart FAB on mobile
          (the FAB is also bottom-center but hidden when the drawer is open).
        */}
        <Toaster
          position="bottom-center"
          gutter={12}
          containerStyle={{ bottom: '80px' }}
          toastOptions={{
            style: {
              fontFamily: 'var(--restaurant-font, system-ui)',
              borderRadius: '14px',
              padding: '12px 16px',
              fontSize: '14px',
              maxWidth: '380px',
            },
            success: {
              iconTheme: {
                primary: 'var(--restaurant-primary)',
                secondary: '#fff',
              },
            },
          }}
        />
        </CartProvider>
      </CustomerProvider>
    </ThemeProvider>
  )
}
