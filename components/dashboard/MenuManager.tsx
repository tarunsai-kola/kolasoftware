'use client'

import { useState, useRef } from 'react'
import MenuListTable from './menu/MenuListTable'
import MenuBuilder from './menu/MenuBuilder'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// Basic type matching Supabase
export interface MenuItem {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  is_available: boolean
  sort_order: number
}

interface MenuManagerProps {
  initialItems: MenuItem[]
  categories: string[]
  restaurantId: string
  theme: {
    primaryColor: string
  }
}

export default function MenuManager({ initialItems, categories: initialCategories, restaurantId, theme }: MenuManagerProps) {
  const [items, setItems] = useState<MenuItem[]>(initialItems)
  const [categories, setCategories] = useState<string[]>(initialCategories)
  
  // View states
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isPastingJson, setIsPastingJson] = useState(false)
  const [pastedJson, setPastedJson] = useState('')

  const processMenuJson = async (jsonString: string) => {
    try {
      setIsUploading(true)
      const json = JSON.parse(jsonString)
      if (!Array.isArray(json)) {
        throw new Error('JSON must be an array of menu items')
      }

      const supabase = createClient()
      
      // Format for DB
      const dbItems = json.map((item: any) => ({
        restaurant_id: restaurantId,
        name: item.name,
        description: item.description || null,
        price: item.price || 0,
        category: item.category || 'Uncategorized',
        image_url: null, // explicitly idle as requested
        is_available: item.is_available !== undefined ? item.is_available : true,
        sort_order: item.sort_order || 0,
        // other defaults
        food_type: item.food_type || 'veg',
        cuisine_tags: item.cuisine_tags || [],
        prep_time_minutes: item.prep_time_minutes || 15,
        spice_level: item.spice_level || 'none',
        sku: item.sku || null,
        discounted_price: item.discounted_price || null,
        dine_in_price: item.dine_in_price || null,
        delivery_price: item.delivery_price || null,
        variant_groups: item.variant_groups || [],
        addon_groups: item.addon_groups || [],
        schedule_type: item.schedule_type || 'always',
        schedule_slots: item.schedule_slots || []
      }))

      const { data, error } = await supabase
        .from('menu_items')
        .insert(dbItems)
        .select()

      if (error) throw error

      toast.success(`Successfully added ${data.length} items!`)
      
      // Update local state
      setItems(prev => [...prev, ...(data as MenuItem[])])
      
      // Update categories
      const newCategories = new Set(categories)
      data.forEach(item => newCategories.add(item.category))
      setCategories(Array.from(newCategories).sort())
      
      setIsPastingJson(false)
      setPastedJson('')

    } catch (err: any) {
      console.error(err)
      toast.error('Failed to parse JSON. Ensure format is correct.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      await processMenuJson(event.target?.result as string)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  const handleSaveMenuBuilder = (savedItem: MenuItem) => {
    setIsBuilderOpen(false)
    setEditingItem(null)
    
    // Update local categories list if new category was added
    if (savedItem.category && !categories.includes(savedItem.category)) {
      setCategories(prev => [...prev, savedItem.category].sort())
    }

    setItems(prev => {
      const exists = prev.find(i => i.id === savedItem.id)
      if (exists) {
        return prev.map(i => i.id === savedItem.id ? savedItem : i)
      } else {
        return [...prev, savedItem]
      }
    })
  }

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setIsBuilderOpen(true)
  }

  const handleCategoryReorder = async (newOrder: string[]) => {
    setCategories(newOrder) // Optimistic update
    
    try {
      const res = await fetch('/api/admin/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          category_order: newOrder
        })
      })
      if (!res.ok) throw new Error('Failed to update category order')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save category order')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  
  // If the builder is open, render it full screen over the dashboard
  if (isBuilderOpen) {
    return (
      <MenuBuilder
        restaurantId={restaurantId}
        existingItem={editingItem}
        categories={categories}
        theme={theme}
        onClose={() => {
          setIsBuilderOpen(false)
          setEditingItem(null)
        }}
        onSave={handleSaveMenuBuilder}
      />
    )
  }

  return (
    <div className="flex flex-col h-full space-y-6 overflow-y-auto pb-6 overflow-x-hidden">
      {/* Sample JSON Reference */}
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl shadow-sm text-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-indigo-900">Sample JSON Format for Upload</h3>
          <span className="text-indigo-600 text-xs">(Images can be uploaded manually later)</span>
        </div>
        <pre className="bg-white p-3 rounded border border-indigo-100 text-indigo-800 overflow-x-auto">
          {`[
  {
    "name": "Classic Burger",
    "description": "Juicy beef patty with lettuce and tomato",
    "price": 12.99,
    "category": "Main Course",
    "is_available": true,
    "sort_order": 1,
    "food_type": "non-veg",
    "prep_time_minutes": 15,
    "spice_level": "none"
  }
]`}
        </pre>
      </div>

      <input 
        type="file" 
        accept=".json" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {isPastingJson && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
          <h3 className="font-bold text-gray-900">Paste JSON Data</h3>
          <textarea
            value={pastedJson}
            onChange={(e) => setPastedJson(e.target.value)}
            className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-gray-900 bg-white"
            placeholder="Paste your JSON array here..."
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setIsPastingJson(false)}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => processMenuJson(pastedJson)}
              disabled={isUploading || !pastedJson.trim()}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Saving...' : 'Save JSON'}
            </button>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Your Menu</h2>
          <p className="text-sm text-gray-500">Manage categories, items, and availability.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {items.length > 0 && (
            <button
              className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Preview Menu
            </button>
          )}
          <button
            onClick={() => setIsPastingJson(!isPastingJson)}
            className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Paste JSON
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 sm:flex-none px-4 py-2 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload JSON'}
          </button>
          <button
            onClick={() => {
              setEditingItem(null)
              setIsBuilderOpen(true)
            }}
            className="flex-1 sm:flex-none rounded-lg px-5 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.primaryColor }}
          >
            + Add Menu Item
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm py-20 px-4 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Start building your menu</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Create a beautiful, organized menu that helps customers easily find and order what they want.</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  setEditingItem(null)
                  setIsBuilderOpen(true)
                }}
                className="px-8 py-3 rounded-xl text-white font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Create first item
              </button>
              <button 
                onClick={() => setIsPastingJson(true)}
                className="px-8 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                Paste JSON
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-8 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload JSON'}
              </button>
            </div>
          </div>
        ) : (
          <MenuListTable 
            items={items}
            setItems={setItems}
            categories={categories}
            theme={theme}
            onEdit={handleEditItem}
            onCategoryReorder={handleCategoryReorder}
          />
        )}
      </div>
    </div>
  )
}
