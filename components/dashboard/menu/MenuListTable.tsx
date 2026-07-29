'use client'

import { useState, useMemo } from 'react'
import { MenuItem } from '../MenuManager'
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
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface MenuListTableProps {
  items: MenuItem[]
  setItems: React.Dispatch<React.SetStateAction<MenuItem[]>>
  categories: string[]
  theme: { primaryColor: string }
  onEdit: (item: MenuItem) => void
  onCategoryReorder: (newOrder: string[]) => void
}

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
      className={`flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition-all ${
        isDragging ? 'shadow-lg opacity-90 ring-2 ring-indigo-500' : 'hover:border-gray-300'
      } ${!item.is_available ? 'opacity-60 bg-gray-50' : ''}`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
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
        
        {item.image_url ? (
          <img src={item.image_url} alt="" className="h-12 w-12 rounded-md object-cover border border-gray-100" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-gray-900">{item.name}</h3>
            {!item.is_available && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                Out of Stock
              </span>
            )}
          </div>
          {item.description && (
            <p className="truncate text-xs text-gray-500 mt-0.5">{item.description}</p>
          )}
        </div>
        
        <div className="w-24 text-right pr-4">
          <span className="font-bold text-gray-900">₹{item.price}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1 border-l border-gray-100 pl-4">
        <label className="relative inline-flex items-center cursor-pointer mr-2" title={item.is_available ? "Mark Unavailable" : "Mark Available"}>
          <input type="checkbox" className="sr-only peer" checked={item.is_available} onChange={() => onToggleAvailable(item)} />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
        </label>

        <button
          onClick={() => onEdit(item)}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
              onDelete(item.id)
            }
          }}
          className="rounded p-1.5 text-red-500 hover:bg-red-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  )
}

function SortableCategorySection({
  category,
  categoryItems,
  sensors,
  handleDragEnd,
  onEdit,
  handleDelete,
  handleToggleAvailable
}: {
  category: string
  categoryItems: MenuItem[]
  sensors: any
  handleDragEnd: (event: DragEndEvent) => void
  onEdit: (item: MenuItem) => void
  handleDelete: (id: string) => void
  handleToggleAvailable: (item: MenuItem) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`rounded-xl border ${isDragging ? 'border-indigo-500 shadow-xl opacity-90' : 'border-gray-100 shadow-sm'} bg-gray-50/30 overflow-hidden relative`}
    >
      <div className="bg-gray-100/50 px-5 py-3 border-b border-gray-100 flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing p-1"
            aria-label={`Drag to reorder category ${category}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-800">{category}</h2>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-200">
          {categoryItems.length} items
        </span>
      </div>
      
      <div className="p-4">
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
                  onEdit={onEdit}
                  onDelete={handleDelete}
                  onToggleAvailable={handleToggleAvailable}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}

export default function MenuListTable({ items, setItems, categories, theme, onEdit, onCategoryReorder }: MenuListTableProps) {
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStock, setFilterStock] = useState<'all' | 'in_stock' | 'out_of_stock'>('all')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleToggleAvailable = async (item: MenuItem) => {
    const newValue = !item.is_available
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: newValue } : i))
    
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: newValue })
      .eq('id', item.id)

    if (error) {
      toast.error('Failed to update availability')
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !newValue } : i))
    } else {
      toast.success(`${item.name} is now ${newValue ? 'available' : 'unavailable'}`)
    }
  }

  const handleDelete = async (id: string) => {
    const originalItems = [...items]
    setItems(prev => prev.filter(i => i.id !== id))
    
    const { error } = await supabase.from('menu_items').delete().eq('id', id)

    if (error) {
      toast.error('Failed to delete item')
      setItems(originalItems)
    } else {
      toast.success('Item deleted')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const activeItem = items.find(i => i.id === active.id)
      if (!activeItem) return
      
      const category = activeItem.category
      
      setItems((items) => {
        const categoryItems = items.filter(i => i.category === category)
        const oldIndex = categoryItems.findIndex(i => i.id === active.id)
        const newIndex = categoryItems.findIndex(i => i.id === over.id)
        const newCategoryItems = arrayMove(categoryItems, oldIndex, newIndex)
        
        const updatedCategoryItems = newCategoryItems.map((item, index) => ({
          ...item,
          sort_order: index
        }))
        
        const otherItems = items.filter(i => i.category !== category)
        const allItems = [...otherItems, ...updatedCategoryItems]
        
        syncSortOrder(updatedCategoryItems)
        return allItems
      })
    }
  }

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = categories.indexOf(active.id as string)
      const newIndex = categories.indexOf(over.id as string)
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(categories, oldIndex, newIndex)
        onCategoryReorder(newOrder)
      }
    }
  }

  const syncSortOrder = async (updatedItems: MenuItem[]) => {
    const promises = updatedItems.map(item => 
      supabase.from('menu_items').update({ sort_order: item.sort_order }).eq('id', item.id)
    )
    try {
      await Promise.all(promises)
    } catch (err) {
      toast.error('Failed to save new order')
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesStock = filterStock === 'all' ? true : 
                           filterStock === 'in_stock' ? item.is_available : !item.is_available
      return matchesSearch && matchesStock
    })
  }, [items, searchQuery, filterStock])

  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = filteredItems
      .filter(item => item.category === category)
      .sort((a, b) => a.sort_order - b.sort_order)
    return acc
  }, {} as Record<string, MenuItem[]>)

  return (
    <div className="space-y-6">
      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            className="block w-full sm:w-auto pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value as any)}
          >
            <option value="all">All Items</option>
            <option value="in_stock">In Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Menu Categories List */}
      <div className="space-y-8">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCategoryDragEnd}
        >
          <SortableContext 
            items={categories}
            strategy={verticalListSortingStrategy}
          >
            {categories.map(category => {
              const categoryItems = groupedItems[category]
              if (!categoryItems || categoryItems.length === 0) return null

              return <SortableCategorySection 
                       key={category}
                       category={category}
                       categoryItems={categoryItems}
                       sensors={sensors}
                       handleDragEnd={handleDragEnd}
                       onEdit={onEdit}
                       handleDelete={handleDelete}
                       handleToggleAvailable={handleToggleAvailable}
                     />
            })}
          </SortableContext>
        </DndContext>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  )
}
