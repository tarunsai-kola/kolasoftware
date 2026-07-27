'use client'

import { MenuItemDraft } from './types'

interface CategoryPanelProps {
  draft: Partial<MenuItemDraft>
  updateDraft: (updates: Partial<MenuItemDraft>) => void
  categories: string[]
}

export default function CategoryPanel({ draft, updateDraft, categories }: CategoryPanelProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Select or create a category</h2>
        <p className="mt-1 text-sm text-gray-500">
          Categories help organize your menu (e.g., Starters, Main Course, Beverages).
        </p>
      </div>

      <div className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category Name
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              name="category"
              id="category"
              className="block w-full rounded-md border-gray-300 pl-3 pr-10 py-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border text-gray-900"
              placeholder="e.g. Biryani"
              value={draft.category || ''}
              onChange={(e) => updateDraft({ category: e.target.value })}
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          {categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 py-1">Existing categories:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => updateDraft({ category: cat })}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    draft.category === cat
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
