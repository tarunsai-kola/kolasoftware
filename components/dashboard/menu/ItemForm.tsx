'use client'

import { MenuItemDraft } from './types'

interface ItemFormProps {
  draft: Partial<MenuItemDraft>
  updateDraft: (updates: Partial<MenuItemDraft>) => void
}

export default function ItemForm({ draft, updateDraft }: ItemFormProps) {
  const toggleCuisineTag = (tag: string) => {
    const currentTags = draft.cuisine_tags || []
    if (currentTags.includes(tag)) {
      updateDraft({ cuisine_tags: currentTags.filter(t => t !== tag) })
    } else {
      updateDraft({ cuisine_tags: [...currentTags, tag] })
    }
  }

  const commonTags = ['North Indian', 'South Indian', 'Chinese', 'Fast Food', 'Beverages', 'Desserts', 'Healthy', 'Vegan']

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Item Details</h2>
        <p className="mt-1 text-sm text-gray-500">Provide the basic information about your dish.</p>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            placeholder="e.g. Chicken Tikka Masala"
            value={draft.name || ''}
            onChange={(e) => updateDraft({ name: e.target.value })}
          />
        </div>

        {/* Short Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Short Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            placeholder="Describe the taste, ingredients, or cooking method..."
            value={draft.description || ''}
            onChange={(e) => updateDraft({ description: e.target.value })}
          />
          <p className="mt-1 text-xs text-gray-500">Keep it under 150 characters for best display on mobile apps.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Food Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Food Type</label>
            <div className="flex gap-3">
              {(['veg', 'non-veg', 'egg'] as const).map((type) => (
                <label key={type} className={`cursor-pointer flex-1 flex flex-col items-center justify-center py-2 px-3 border rounded-lg transition-colors ${
                  draft.food_type === type ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="food_type"
                    className="sr-only"
                    checked={draft.food_type === type}
                    onChange={() => updateDraft({ food_type: type })}
                  />
                  <div className="flex items-center justify-center mb-1">
                    {type === 'veg' && (
                      <div className="w-4 h-4 border border-green-600 flex items-center justify-center p-[2px]">
                        <div className="w-full h-full bg-green-600 rounded-full"></div>
                      </div>
                    )}
                    {type === 'non-veg' && (
                      <div className="w-4 h-4 border border-red-600 flex items-center justify-center p-[2px]">
                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-red-600"></div>
                      </div>
                    )}
                    {type === 'egg' && (
                      <div className="w-4 h-4 border border-yellow-500 flex items-center justify-center p-[2px]">
                        <div className="w-2 h-2.5 bg-yellow-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Spice Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Spice Level</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              value={draft.spice_level || 'none'}
              onChange={(e) => updateDraft({ spice_level: e.target.value as any })}
            >
              <option value="none">Not Spicy</option>
              <option value="mild">Mild</option>
              <option value="medium">Medium</option>
              <option value="spicy">Spicy 🌶️</option>
              <option value="extra-spicy">Extra Spicy 🌶️🌶️</option>
            </select>
          </div>
        </div>

        {/* Preparation Time & SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="prep_time" className="block text-sm font-medium text-gray-700">
              Prep Time (mins)
            </label>
            <input
              type="number"
              id="prep_time"
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              value={draft.prep_time_minutes || 15}
              onChange={(e) => updateDraft({ prep_time_minutes: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
              SKU <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              id="sku"
              className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              placeholder="e.g. CTM-001"
              value={draft.sku || ''}
              onChange={(e) => updateDraft({ sku: e.target.value })}
            />
          </div>
        </div>

        {/* Cuisine Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine & Tags</label>
          <div className="flex flex-wrap gap-2">
            {commonTags.map(tag => {
              const isSelected = (draft.cuisine_tags || []).includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleCuisineTag(tag)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {isSelected && <span className="mr-1">✓</span>}
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
