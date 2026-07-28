'use client'

import { useState, useTransition } from 'react'
import { updateRestaurantSettings, changePassword } from '@/app/(dashboard)/settings/actions'
import toast from 'react-hot-toast'

// =============================================================================
// Types
// =============================================================================

interface Restaurant {
  id: string
  name: string
  domain: string
  subdomain: string
  logo_url: string | null
  primary_color: string
  font_family: string
  banner_image_url: string | null
  kitchen_email: string
  status: string
  subscription_status: string
  address: string | null
  lat: number | null
  lng: number | null
  delivery_radius_km: number | null
  is_cod_enabled?: boolean
  is_online_payment_enabled?: boolean
  razorpay_key_id?: string | null
  razorpay_key_secret?: string | null
  razorpay_webhook_secret?: string | null
  whatsapp_number?: string | null
  is_accepting_orders?: boolean
  announcement_message?: string | null
}

const FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Outfit',
  'Poppins',
  'Nunito',
  'Playfair Display',
  'Lato',
  'Montserrat',
]

const STATUS_BADGE: Record<string, string> = {
  active:          'bg-emerald-50 text-emerald-700 ring-emerald-200',
  trialing:        'bg-blue-50 text-blue-700 ring-blue-200',
  suspended:       'bg-red-50 text-red-700 ring-red-200',
  pending_setup:   'bg-amber-50 text-amber-700 ring-amber-200',
  overdue:         'bg-orange-50 text-orange-700 ring-orange-200',
  cancelled:       'bg-gray-100 text-gray-600 ring-gray-200',
}

// =============================================================================
// Component
// =============================================================================

export default function SettingsClient({ restaurant }: { restaurant: Restaurant }) {
  const [isPending, startTransition] = useTransition()
  const [isPasswordPending, startPasswordTransition] = useTransition()

  // Password form state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form state
  const [name, setName] = useState(restaurant.name)
  const [kitchenEmail, setKitchenEmail] = useState(restaurant.kitchen_email)
  const [primaryColor, setPrimaryColor] = useState(restaurant.primary_color)
  const [fontFamily, setFontFamily] = useState(restaurant.font_family)
  const [logoUrl, setLogoUrl] = useState(restaurant.logo_url ?? '')
  const [bannerUrl, setBannerUrl] = useState(restaurant.banner_image_url ?? '')
  
  const [address, setAddress] = useState(restaurant.address ?? '')
  const [lat, setLat] = useState(restaurant.lat?.toString() ?? '')
  const [lng, setLng] = useState(restaurant.lng?.toString() ?? '')
  const [deliveryRadius, setDeliveryRadius] = useState(restaurant.delivery_radius_km?.toString() ?? '')

  // Payment settings state
  const [isCodEnabled, setIsCodEnabled] = useState(restaurant.is_cod_enabled ?? true)
  const [isOnlinePaymentEnabled, setIsOnlinePaymentEnabled] = useState(restaurant.is_online_payment_enabled ?? false)
  const [razorpayKeyId, setRazorpayKeyId] = useState(restaurant.razorpay_key_id ?? '')
  const [razorpayKeySecret, setRazorpayKeySecret] = useState(restaurant.razorpay_key_secret ?? '')
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState(restaurant.razorpay_webhook_secret ?? '')

  // Contact settings state
  const [whatsappNumber, setWhatsappNumber] = useState(restaurant.whatsapp_number ?? '')

  // Storefront Status state
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(restaurant.is_accepting_orders ?? true)
  const [announcementMessage, setAnnouncementMessage] = useState(restaurant.announcement_message ?? '')

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toFixed(6))
          setLng(position.coords.longitude.toFixed(6))
          toast.success("Location updated! Don't forget to save.")
        },
        (error) => {
          console.error(error)
          toast.error('Could not get location. Check browser permissions.')
        }
      )
    } else {
      toast.error('Geolocation is not supported by this browser.')
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateRestaurantSettings(formData)
      if (result.success) {
        toast.success('Settings saved! Refresh the page to see branding changes.')
      } else {
        toast.error(result.error ?? 'Failed to save settings.')
      }
    })
  }

  const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startPasswordTransition(async () => {
      const result = await changePassword(formData)
      if (result.success) {
        toast.success('Password changed successfully!')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(result.error ?? 'Failed to change password.')
      }
    })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Settings</h1>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset capitalize ${STATUS_BADGE[restaurant.subscription_status] ?? STATUS_BADGE.trialing}`}>
            {restaurant.subscription_status}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset capitalize ${STATUS_BADGE[restaurant.status] ?? STATUS_BADGE.active}`}>
            {restaurant.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* ── Scrollable Content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">

          {/* ── Account Info (read-only) ─────────────────────────────────── */}
          <Section title="Account Info" description="Your domain and identifiers — managed by the platform.">
            <ReadonlyField label="Restaurant ID" value={restaurant.id} mono />
            <ReadonlyField label="Subdomain" value={`${restaurant.subdomain}.localhost:3000`} />
            <ReadonlyField label="Custom Domain" value={restaurant.domain || 'Not configured'} />
          </Section>

          {/* ── Restaurant Profile ──────────────────────────────────────── */}
          <Section title="Restaurant Profile" description="Update your restaurant's name and notification email.">
            <Field label="Restaurant Name" htmlFor="name" required>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Tarun's Kitchen"
                className={inputCls}
              />
            </Field>

            <Field label="Kitchen / Notification Email" htmlFor="kitchen_email" required hint="New order email alerts are sent here.">
              <input
                id="kitchen_email"
                name="kitchen_email"
                type="email"
                value={kitchenEmail}
                onChange={(e) => setKitchenEmail(e.target.value)}
                required
                placeholder="kitchen@example.com"
                className={inputCls}
              />
            </Field>
          </Section>

          {/* ── Branding ─────────────────────────────────────────────────── */}
          <Section title="Branding" description="Customize how your storefront looks to customers.">
            {/* Primary Color */}
            <Field label="Brand Color" htmlFor="primary_color" hint="Used for buttons, accents, and highlights.">
              <div className="flex items-center gap-3">
                <input
                  id="primary_color"
                  name="primary_color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200 p-1 shadow-sm"
                />
                <span className="font-mono text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md">{primaryColor}</span>
                <div
                  className="h-8 w-32 rounded-lg shadow-sm border border-gray-200 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  Preview
                </div>
              </div>
            </Field>

            {/* Font Family */}
            <Field label="Font Family" htmlFor="font_family" hint="Applied to your customer storefront.">
              <select
                id="font_family"
                name="font_family"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className={inputCls}
                style={{ fontFamily }}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </select>
            </Field>

            {/* Logo URL */}
            <Field label="Logo URL" htmlFor="logo_url" hint="Paste a direct image link (JPEG, PNG, WebP).">
              <input
                id="logo_url"
                name="logo_url"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className={inputCls}
              />
              {logoUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-12 w-12 rounded-full object-cover border border-gray-200 shadow-sm"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <span className="text-xs text-gray-400">Logo preview</span>
                </div>
              )}
            </Field>

            {/* Banner URL */}
            <Field label="Banner / Hero Image URL" htmlFor="banner_image_url" hint="Displayed at the top of your storefront menu page.">
              <input
                id="banner_image_url"
                name="banner_image_url"
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className={inputCls}
              />
              {bannerUrl && (
                <div className="mt-2">
                  <img
                    src={bannerUrl}
                    alt="Banner preview"
                    className="w-full max-w-md h-24 rounded-lg object-cover border border-gray-200 shadow-sm"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
            </Field>
          </Section>

          {/* ── Location & Delivery Zone ─────────────────────────────────── */}
          <Section title="Location & Delivery Zone" description="Set your exact location and delivery radius.">
            <div className="flex justify-end -mt-10 mb-2 relative z-10 mr-4">
              <button
                type="button"
                onClick={handleGetLocation}
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none"
              >
                📍 Use Current Location
              </button>
            </div>
            
            <Field label="Address" htmlFor="address" hint="Physical address of the restaurant.">
              <input
                id="address"
                name="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City"
                className={inputCls}
              />
            </Field>
            
            <div className="grid grid-cols-2 gap-4">
              <Field label="Latitude" htmlFor="lat" hint="e.g. 28.7041">
                <input
                  id="lat"
                  name="lat"
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="0.0000"
                  className={inputCls}
                />
              </Field>
              <Field label="Longitude" htmlFor="lng" hint="e.g. 77.1025">
                <input
                  id="lng"
                  name="lng"
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="0.0000"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Delivery Radius (km)" htmlFor="delivery_radius_km" hint="Maximum distance you deliver to. Orders outside this radius will be rejected.">
              <input
                id="delivery_radius_km"
                name="delivery_radius_km"
                type="number"
                step="any"
                min="0"
                value={deliveryRadius}
                onChange={(e) => setDeliveryRadius(e.target.value)}
                placeholder="5"
                className={inputCls}
              />
            </Field>
          </Section>

          {/* ── Contact & Support ────────────────────────────────────────── */}
          <Section title="Contact & Support" description="Let customers reach out to you via WhatsApp.">
            <Field label="WhatsApp Support Number" htmlFor="whatsapp_number" hint="Include country code (e.g. 919876543210). Leave blank to disable WhatsApp floating button.">
              <input
                id="whatsapp_number"
                name="whatsapp_number"
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="919876543210"
                className={inputCls}
              />
            </Field>
          </Section>

          {/* ── Storefront Status ────────────────────────────────────────── */}
          <Section title="Storefront Status" description="Control if your restaurant is open for orders and display announcements.">
            <input type="hidden" name="is_accepting_orders" value={isAcceptingOrders ? 'true' : 'false'} />

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <div>
                  <span className="block text-sm font-semibold text-gray-900">Accepting Orders</span>
                  <span className="block text-xs text-gray-500 mt-1">If disabled, your storefront will show as "Closed" and customers cannot place orders.</span>
                </div>
                <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2" style={{ backgroundColor: isAcceptingOrders ? 'var(--restaurant-primary, #111827)' : '#E5E7EB' }}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isAcceptingOrders}
                    onChange={(e) => setIsAcceptingOrders(e.target.checked)}
                  />
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAcceptingOrders ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </label>

              <Field label="Announcement Message (Marquee)" htmlFor="announcement_message" hint="This message will scroll horizontally across your storefront. Leave blank to hide.">
                <input
                  id="announcement_message"
                  name="announcement_message"
                  type="text"
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="e.g. We are closed today due to heavy rain. See you tomorrow!"
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* ── Payment Settings ─────────────────────────────────────────── */}
          <Section title="Payment Settings" description="Configure how customers can pay for their orders.">
            {/* Hidden inputs to ensure booleans are sent properly if using controlled state */}
            <input type="hidden" name="is_cod_enabled" value={isCodEnabled ? 'true' : 'false'} />
            <input type="hidden" name="is_online_payment_enabled" value={isOnlinePaymentEnabled ? 'true' : 'false'} />

            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isCodEnabled}
                  onChange={(e) => setIsCodEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm font-medium text-gray-900">Enable Cash on Delivery</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isOnlinePaymentEnabled}
                  onChange={(e) => setIsOnlinePaymentEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm font-medium text-gray-900">Enable Online Payment (Razorpay)</span>
              </label>
            </div>

            {isOnlinePaymentEnabled && (
              <div className="mt-6 space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <Field label="Razorpay Key ID" htmlFor="razorpay_key_id" required>
                  <input
                    id="razorpay_key_id"
                    name="razorpay_key_id"
                    type="text"
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    required={isOnlinePaymentEnabled}
                    placeholder="rzp_live_xxxxxxxxxxx"
                    className={inputCls}
                  />
                </Field>

                <Field label="Razorpay Key Secret" htmlFor="razorpay_key_secret" required hint="Stored securely and never exposed to the frontend.">
                  <input
                    id="razorpay_key_secret"
                    name="razorpay_key_secret"
                    type="password"
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                    required={isOnlinePaymentEnabled}
                    placeholder="••••••••••••••••"
                    className={inputCls}
                  />
                </Field>

                <Field label="Razorpay Webhook Secret" htmlFor="razorpay_webhook_secret" required hint="Used to securely verify payment events.">
                  <input
                    id="razorpay_webhook_secret"
                    name="razorpay_webhook_secret"
                    type="password"
                    value={razorpayWebhookSecret}
                    onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                    required={isOnlinePaymentEnabled}
                    placeholder="••••••••••••••••"
                    className={inputCls}
                  />
                </Field>
              </div>
            )}
          </Section>

          {/* ── Save Button ──────────────────────────────────────────────── */}
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: primaryColor }}
            >
              {isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Saving…
                </>
              ) : 'Save Settings'}
            </button>
            <p className="text-xs text-gray-400">Changes take effect on next page load.</p>
          </div>
        </form>

        {/* ── Change Password ─────────────────────────────────────────── */}
        <form onSubmit={handlePasswordChange} className="max-w-2xl mt-8">
          <Section title="Security" description="Change your login password. Use a strong password you don't use elsewhere.">
            <Field label="New Password" htmlFor="new_password" required hint="Must be at least 8 characters.">
              <div className="relative">
                <input
                  id="new_password"
                  name="new_password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className={inputCls}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
            </Field>

            <Field label="Confirm New Password" htmlFor="confirm_password" required>
              <div className="relative">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                  className={`${inputCls} ${confirmPassword && confirmPassword !== newPassword ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500 mt-1">⚠ Passwords do not match</p>
              )}
            </Field>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isPasswordPending || !newPassword || newPassword !== confirmPassword}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-900 bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-80 disabled:opacity-40 focus:outline-none"
              >
                {isPasswordPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Changing…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    Change Password
                  </>
                )}
              </button>
            </div>
          </Section>
        </form>
      </div>
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

const inputCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors'

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="px-5 py-5 space-y-5">{children}</div>
    </div>
  )
}

function Field({ label, htmlFor, hint, required, children }: { label: string; htmlFor: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  )
}

function ReadonlyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  )
}
