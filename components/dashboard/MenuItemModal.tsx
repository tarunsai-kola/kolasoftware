'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'
import type { MenuItem } from './MenuManager'
import { getErrorMessage } from '@/lib/utils/error'

interface MenuItemModalProps {
  restaurantId: string
  existingItem: MenuItem | null
  categories: string[]
  theme: {
    primaryColor: string
  }
  onClose: () => void
  onSave: (item: MenuItem) => void
}

export default function MenuItemModal({
  restaurantId,
  existingItem,
  categories,
  theme,
  onClose,
  onSave,
}: MenuItemModalProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Form State
  const [name, setName] = useState(existingItem?.name || '')
  const [description, setDescription] = useState(existingItem?.description || '')
  const [price, setPrice] = useState(existingItem?.price?.toString() || '')
  
  // Category combo-box state
  const [category, setCategory] = useState(existingItem?.category || '')
  const [isNewCategory, setIsNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [imageUrl, setImageUrl] = useState<string | null>(existingItem?.image_url || null)
  const [isAvailable, setIsAvailable] = useState(existingItem ? existingItem.is_available : true)

  // ── Image Upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }

    setIsUploading(true)
    
    // Generate a clean path: restaurantId/uuid-filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${restaurantId}/${fileName}`

    const { error: uploadError, data } = await supabase.storage
      .from('menu-images')
      .upload(filePath, file, { upsert: false })

    if (uploadError) {
      console.error(uploadError)
      toast.error('Failed to upload image')
      setIsUploading(false)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('menu-images')
      .getPublicUrl(data.path)

    setImageUrl(publicUrl)
    setIsUploading(false)
    toast.success('Image uploaded')
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const finalCategory = isNewCategory ? newCategoryName.trim() : category
    if (!finalCategory) {
      toast.error('Please select or enter a category')
      setIsLoading(false)
      return
    }

    const payload = {
      restaurant_id: restaurantId,
      name,
      description: description || null,
      price: parseFloat(price),
      category: finalCategory,
      image_url: imageUrl,
      is_available: isAvailable,
    }

    let savedItem: MenuItem | null = null

    if (existingItem) {
      // UPDATE
      const { data, error } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', existingItem.id)
        .select()
        .single()

      if (error) {
        toast.error(getErrorMessage(error))
      } else {
        savedItem = data as MenuItem
        toast.success('Item updated')
      }
    } else {
      // INSERT (sort_order will default to 0, which we can fix by fetching max sort_order if needed, but MVP is fine)
      const { data, error } = await supabase
        .from('menu_items')
        .insert([payload])
        .select()
        .single()

      if (error) {
        toast.error(getErrorMessage(error))
      } else {
        savedItem = data as MenuItem
        toast.success('Item created')
      }
    }

    setIsLoading(false)
    if (savedItem) {
      onSave(savedItem)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {existingItem ? 'Edit Menu Item' : 'Add Menu Item'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Image</label>
              <div className="mt-2 flex items-center gap-4">
                {imageUrl ? (
                  <div className="relative h-20 w-20 flex-shrink-0">
                    <img src={imageUrl} alt="" className="h-20 w-20 rounded-xl object-cover border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-red-500 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                  >
                    {isUploading ? (
                      <span className="text-xs font-medium">Uploading...</span>
                    ) : (
                      <>
                        <svg className="mb-1 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-xs font-medium">Upload</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                />
                <p className="text-xs text-gray-500">Recommended: Square image, max 2MB.<br/>Supported: JPG, PNG, WEBP.</p>
              </div>
            </div>

            {/* Name & Price */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g. Garlic Bread"
                />
              </div>
              <div className="w-1/3">
                <label className="block text-sm font-medium text-gray-700">Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Optional short description..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <div className="mt-1">
                {!isNewCategory ? (
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsNewCategory(true)
                        setCategory('')
                      } else {
                        setCategory(e.target.value)
                      }
                    }}
                    required={!isNewCategory}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__NEW__">+ Create new category</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                      placeholder="New category name"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewCategory(false)
                        setNewCategoryName('')
                        setCategory(categories[0] || '')
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-5">
              <div>
                <label className="block text-sm font-medium text-gray-900">Available</label>
                <p className="text-xs text-gray-500">Customers can order this item</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                  isAvailable ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
                style={isAvailable ? { backgroundColor: theme.primaryColor } : {}}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAvailable ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading || isUploading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploading}
              className="rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {isLoading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
