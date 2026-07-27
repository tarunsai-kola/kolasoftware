'use client'

import { useState } from 'react'
import MenuListTable from './menu/MenuListTable'
import MenuBuilder from './menu/MenuBuilder'

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
    <div className="flex flex-col h-full space-y-6">
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
              <button className="px-8 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:border-gray-300 hover:bg-gray-50 transition-all">
                Import from spreadsheet
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
          />
        )}
      </div>
    </div>
  )
}
