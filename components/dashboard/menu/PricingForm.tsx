'use client'

import { MenuItemDraft } from './types'

interface PricingFormProps {
  draft: Partial<MenuItemDraft>
  updateDraft: (updates: Partial<MenuItemDraft>) => void
}

export default function PricingForm({ draft, updateDraft }: PricingFormProps) {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Pricing & Variants</h2>
        <p className="mt-1 text-sm text-gray-500">Set the base price and optional variations (like portion sizes).</p>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Base Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Base Price (₹) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                id="price"
                min="0"
                className="block w-full pl-7 pr-3 py-2 rounded-md border-gray-300 border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                placeholder="0.00"
                value={draft.price || ''}
                onChange={(e) => updateDraft({ price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Discounted Price */}
          <div>
            <label htmlFor="discounted_price" className="block text-sm font-medium text-gray-700">
              Discounted Price (₹) <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                id="discounted_price"
                min="0"
                className="block w-full pl-7 pr-3 py-2 rounded-md border-gray-300 border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                placeholder="0.00"
                value={draft.discounted_price || ''}
                onChange={(e) => updateDraft({ discounted_price: e.target.value ? parseFloat(e.target.value) : null })}
              />
            </div>
          </div>
        </div>

        {/* Channel Pricing */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Channel Specific Pricing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="dine_in_price" className="block text-sm font-medium text-gray-700">
                Dine-in Price
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  id="dine_in_price"
                  min="0"
                  className="block w-full pl-7 pr-3 py-2 rounded-md border-gray-300 border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                  placeholder="Same as base"
                  value={draft.dine_in_price || ''}
                  onChange={(e) => updateDraft({ dine_in_price: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>
            </div>
            <div>
              <label htmlFor="delivery_price" className="block text-sm font-medium text-gray-700">
                Delivery Price
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  id="delivery_price"
                  min="0"
                  className="block w-full pl-7 pr-3 py-2 rounded-md border-gray-300 border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                  placeholder="Same as base"
                  value={draft.delivery_price || ''}
                  onChange={(e) => updateDraft({ delivery_price: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Variants Builder UI */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Portion Sizes / Variants</h3>
              <p className="text-xs text-gray-500">e.g. Half, Full, Large, Small</p>
            </div>
            <button 
              type="button"
              onClick={() => {
                const newGroup = {
                  id: Date.now().toString(),
                  name: 'Portion Size',
                  variants: [{ id: Date.now().toString() + '-1', name: '', price: 0 }]
                }
                updateDraft({ variant_groups: [...(draft.variant_groups || []), newGroup] })
              }}
              className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
            >
              + Add Variant Group
            </button>
          </div>
          
          {(draft.variant_groups && draft.variant_groups.length > 0) ? (
            <div className="space-y-4">
              {draft.variant_groups.map((group, groupIndex) => (
                <div key={group.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <input 
                      type="text"
                      className="text-sm font-semibold bg-transparent border-b border-gray-300 focus:border-indigo-500 focus:outline-none px-1 py-1 text-gray-900"
                      value={group.name}
                      onChange={(e) => {
                        const newGroups = [...draft.variant_groups!]
                        newGroups[groupIndex].name = e.target.value
                        updateDraft({ variant_groups: newGroups })
                      }}
                      placeholder="Group Name (e.g. Size)"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const newGroups = draft.variant_groups!.filter((_, idx) => idx !== groupIndex)
                        updateDraft({ variant_groups: newGroups })
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove Group
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {group.variants.map((variant, variantIndex) => (
                      <div key={variant.id} className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Option name (e.g. Half)"
                          className="flex-1 block w-full rounded-md border-gray-300 py-1.5 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm text-gray-900"
                          value={variant.name}
                          onChange={(e) => {
                            const newGroups = [...draft.variant_groups!]
                            newGroups[groupIndex].variants[variantIndex].name = e.target.value
                            updateDraft({ variant_groups: newGroups })
                          }}
                        />
                        <div className="relative w-32 shrink-0">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₹</span>
                          </div>
                          <input
                            type="number"
                            placeholder="Price"
                            className="block w-full pl-7 pr-2 py-1.5 rounded-md border-gray-300 border shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                            value={variant.price || ''}
                            onChange={(e) => {
                              const newGroups = [...draft.variant_groups!]
                              newGroups[groupIndex].variants[variantIndex].price = parseFloat(e.target.value) || 0
                              updateDraft({ variant_groups: newGroups })
                            }}
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            const newGroups = [...draft.variant_groups!]
                            newGroups[groupIndex].variants = newGroups[groupIndex].variants.filter((_, idx) => idx !== variantIndex)
                            updateDraft({ variant_groups: newGroups })
                          }}
                          className="text-gray-400 hover:text-red-500 p-1 shrink-0"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      const newGroups = [...draft.variant_groups!]
                      newGroups[groupIndex].variants.push({ id: Date.now().toString(), name: '', price: 0 })
                      updateDraft({ variant_groups: newGroups })
                    }}
                    className="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-800"
                  >
                    + Add Option
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 border border-dashed border-gray-200 text-center text-sm text-gray-500">
              Click "+ Add Variant Group" to configure multiple sizes or options.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
