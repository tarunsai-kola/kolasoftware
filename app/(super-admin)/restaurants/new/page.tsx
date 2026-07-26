'use client'

import { useState, useRef } from 'react'
import { onboardRestaurant, type OnboardData } from './actions'
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function NewRestaurantPage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [successData, setSuccessData] = useState<{
    restaurantId: string
    subdomain: string
    domain: string | null
    ownerEmail: string
    tempPassword: string
  } | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [domain, setDomain] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#D85A30')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [kitchenEmail, setKitchenEmail] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')

  // ── Auto-suggest Subdomain ────────────────────────────────────────────────
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    if (!subdomain || subdomain === name.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      setSubdomain(val.toLowerCase().replace(/[^a-z0-9]/g, ''))
    }
  }

  // ── Image Upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }

    setIsUploading(true)
    
    // We upload to a temp folder or just directly to a new UUID prefix
    const fileExt = file.name.split('.').pop()
    const filePath = `onboarding-temp/${uuidv4()}.${fileExt}`

    const { error: uploadError, data } = await supabase.storage
      .from('menu-images')
      .upload(filePath, file, { upsert: false })

    if (uploadError) {
      toast.error('Failed to upload logo')
      setIsUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('menu-images')
      .getPublicUrl(data.path)

    setLogoUrl(publicUrl)
    setIsUploading(false)
    toast.success('Logo uploaded')
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const payload: OnboardData = {
      name,
      subdomain,
      domain: domain.trim() || null,
      logo_url: logoUrl,
      primary_color: primaryColor,
      font_family: fontFamily,
      kitchen_email: kitchenEmail,
      owner_name: ownerName,
      owner_email: ownerEmail
    }

    const result = await onboardRestaurant(payload)

    if (result.error) {
      toast.error(result.error)
    } else if (result.success) {
      setSuccessData({
        restaurantId: result.restaurantId!,
        subdomain,
        domain: domain.trim() || null,
        ownerEmail: result.ownerEmail!,
        tempPassword: result.tempPassword!
      })
      toast.success('Restaurant Onboarded!')
    }

    setIsLoading(false)
  }

  // ── Success Screen ────────────────────────────────────────────────────────
  if (successData) {
    const storefrontUrl = successData.domain 
      ? `https://${successData.domain}` 
      : `https://${successData.subdomain}.yourplatform.com`

    return (
      <div className="mx-auto max-w-2xl mt-12">
        <div className="rounded-2xl border border-green-200 bg-white p-8 shadow-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Onboarding Complete!</h2>
          <p className="text-gray-500 mb-8">
            The restaurant has been securely configured, the owner account was generated, 
            and the welcome email has been dispatched.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 text-left border border-gray-100 space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Storefront URL</label>
              <a href={storefrontUrl} target="_blank" rel="noreferrer" className="block mt-1 text-indigo-600 font-medium hover:underline">
                {storefrontUrl}
              </a>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">Owner Credentials</label>
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                <div className="font-mono text-sm text-gray-900">
                  <div>Email: {successData.ownerEmail}</div>
                  <div>Pass: {successData.tempPassword}</div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Email: ${successData.ownerEmail}\nPassword: ${successData.tempPassword}`)
                    toast.success('Credentials copied')
                  }}
                  className="rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/restaurants"
              className="rounded-lg px-6 py-3 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Back to Directory
            </Link>
            <Link
              href={`/restaurants/${successData.restaurantId}`}
              className="rounded-lg px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              View Restaurant Profile
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Form UI ───────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-4xl pb-12">
      <div className="mb-8">
        <Link href="/restaurants" className="text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 inline-block">
          &larr; Back to Directory
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900">Onboard New Tenant</h1>
        <p className="mt-2 text-sm text-gray-500">
          Create a new restaurant environment. An owner account will be automatically generated and invited.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Brand & Domain</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Restaurant Name *</label>
              <input type="text" required value={name} onChange={handleNameChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Platform Subdomain *</label>
              <div className="relative mt-1 flex rounded-md shadow-sm">
                <input type="text" required value={subdomain} onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} className="block w-full min-w-0 flex-1 rounded-none rounded-l-lg border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm" />
                <span className="inline-flex items-center rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                  .yourplatform.com
                </span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Custom Domain (Optional)</label>
              <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g. spicehouse.com" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm" />
              <p className="mt-1 text-xs text-gray-500">Leave blank if the restaurant does not have a custom domain yet.</p>
            </div>
          </div>
        </div>

        {/* Theming */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Visual Identity</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Logo Upload</label>
              <div className="mt-2 flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative h-20 w-20 flex-shrink-0">
                    <img src={logoUrl} alt="" className="h-20 w-20 rounded-xl object-cover border border-gray-200" />
                    <button type="button" onClick={() => setLogoUrl(null)} className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-red-500 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors">
                    {isUploading ? <span className="text-xs font-medium">...</span> : <span className="text-xs font-medium">Upload</span>}
                  </button>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/jpeg, image/png, image/webp" className="hidden" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Brand Color *</label>
              <div className="mt-1 flex items-center gap-3">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-10 cursor-pointer rounded-md border-0 p-0" />
                <input type="text" required value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Typography *</label>
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="Inter">Inter (Modern Sans)</option>
                <option value="Roboto">Roboto (Clean Sans)</option>
                <option value="Outfit">Outfit (Geometric)</option>
                <option value="Lora">Lora (Elegant Serif)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact & Owner */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Contact & Ownership</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Kitchen Email (For Orders) *</label>
              <input type="email" required value={kitchenEmail} onChange={(e) => setKitchenEmail(e.target.value)} placeholder="kitchen@spicehouse.com" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm" />
            </div>
            
            <div className="md:col-span-2 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Initial Owner Account</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Owner Name *</label>
              <input type="text" required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Owner Login Email *</label>
              <input type="email" required value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/restaurants" className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none disabled:opacity-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading || isUploading}
            className="rounded-lg bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing Transaction...' : 'Onboard Restaurant'}
          </button>
        </div>
      </form>
    </div>
  )
}
