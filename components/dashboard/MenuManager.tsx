'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import MenuItemModal from './MenuItemModal'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Sortable Item Component
// =============================================================================

function SortableMenuItemRow({ 
  item, 
  onEdit, 
  onDelete, 
  onToggleAvailable 
}: { 
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onDelete: (id: string) => void
  onToggleAvailable: (item: MenuItem) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all ${
        isDragging ? 'shadow-lg opacity-90 ring-2 ring-indigo-500' : 'hover:shadow-md'
      } ${!item.is_available ? 'opacity-60 bg-gray-50' : ''}`}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing p-1"
          aria-label="Drag to reorder"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
        
        {/* Image */}
        {item.image_url ? (
          <img src={item.image_url} alt="" className="h-12 w-12 rounded-md object-cover border border-gray-100" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 text-gray-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-gray-900">{item.name}</h3>
            {!item.is_available && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                Out of Stock
              </span>
            )}
          </div>
          {item.description && (
            <p className="truncate text-xs text-gray-500 mt-0.5">{item.description}</p>
          )}
        </div>
        
        {/* Price */}
        <div className="w-24 text-right pr-4">
          <span className="font-bold text-gray-900">₹{item.price}</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1 border-l border-gray-100 pl-4">
        <button
          onClick={() => onToggleAvailable(item)}
          title={item.is_available ? "Mark Unavailable" : "Mark Available"}
          className={`rounded p-1.5 ${item.is_available ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
        >
          {item.is_available ? (
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          )}
        </button>
        <button
          onClick={() => onEdit(item)}
          className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
              onDelete(item.id)
            }
          }}
          className="rounded p-1.5 text-red-600 hover:bg-red-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function MenuManager({ initialItems, categories: initialCategories, restaurantId, theme }: MenuManagerProps) {
  const supabase = createClient()
  const [items, setItems] = useState<MenuItem[]>(initialItems)
  const [categories, setCategories] = useState<string[]>(initialCategories)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px movement to start drag (allows clicking buttons)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ── Actions ───────────────────────────────────────────────────────────────
  
  const handleToggleAvailable = async (item: MenuItem) => {
    const newValue = !item.is_available
    // Optimistic UI
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: newValue } : i))
    
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: newValue })
      .eq('id', item.id)

    if (error) {
      toast.error('Failed to update availability')
      // Revert on error
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !newValue } : i))
    } else {
      toast.success(`${item.name} is now ${newValue ? 'available' : 'unavailable'}`)
    }
  }

  const handleDelete = async (id: string) => {
    const originalItems = [...items]
    setItems(prev => prev.filter(i => i.id !== id))
    
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Failed to delete item')
      setItems(originalItems)
    } else {
      toast.success('Item deleted')
      // Update categories if needed, but not strictly necessary as empty categories just disappear
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      // Find the category of the item being dragged
      const activeItem = items.find(i => i.id === active.id)
      if (!activeItem) return
      
      const category = activeItem.category
      
      setItems((items) => {
        // Only reorder within the same category to keep the array flat but correctly sorted
        const categoryItems = items.filter(i => i.category === category)
        const oldIndex = categoryItems.findIndex(i => i.id === active.id)
        const newIndex = categoryItems.findIndex(i => i.id === over.id)
        
        const newCategoryItems = arrayMove(categoryItems, oldIndex, newIndex)
        
        // Update sort_order based on new position
        const updatedCategoryItems = newCategoryItems.map((item, index) => ({
          ...item,
          sort_order: index
        }))
        
        // Merge back into main list
        const otherItems = items.filter(i => i.category !== category)
        const allItems = [...otherItems, ...updatedCategoryItems]
        
        // Trigger DB update in the background
        syncSortOrder(updatedCategoryItems)
        
        return allItems
      })
    }
  }

  const syncSortOrder = async (updatedItems: MenuItem[]) => {
    // We fire and forget individual updates. For a production app, an RPC for bulk update is better.
    // Given menu sizes are typically small per category, this is acceptable for MVP.
    const promises = updatedItems.map(item => 
      supabase.from('menu_items').update({ sort_order: item.sort_order }).eq('id', item.id)
    )
    
    try {
      await Promise.all(promises)
    } catch (err) {
      console.error('Failed to sync sort order', err)
      toast.error('Failed to save new order')
    }
  }

  const handleSaveModal = (savedItem: MenuItem) => {
    setIsModalOpen(false)
    setEditingItem(null)
    
    if (!categories.includes(savedItem.category)) {
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

  // ── Render ────────────────────────────────────────────────────────────────
  
  // Group items by category to render separate drag-and-drop contexts
  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = items
      .filter(item => item.category === category)
      .sort((a, b) => a.sort_order - b.sort_order)
    return acc
  }, {} as Record<string, MenuItem[]>)

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setEditingItem(null)
            setIsModalOpen(true)
          }}
          className="rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: theme.primaryColor }}
        >
          + Add Menu Item
        </button>
      </div>

      <div className="space-y-10">
        {categories.map(category => {
          const categoryItems = groupedItems[category]
          if (categoryItems.length === 0) return null

          return (
            <div key={category} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">{category}</h2>
              
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={categoryItems.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-3">
                    {categoryItems.map(item => (
                      <SortableMenuItemRow 
                        key={item.id} 
                        item={item} 
                        onEdit={(i) => {
                          setEditingItem(i)
                          setIsModalOpen(true)
                        }}
                        onDelete={handleDelete}
                        onToggleAvailable={handleToggleAvailable}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )
        })}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 py-16">
            <svg className="mb-4 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">Your menu is empty</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first item.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <MenuItemModal
          restaurantId={restaurantId}
          existingItem={editingItem}
          categories={categories}
          theme={theme}
          onClose={() => {
            setIsModalOpen(false)
            setEditingItem(null)
          }}
          onSave={handleSaveModal}
        />
      )}
    </div>
  )
}
