'use client'

import { MenuItemDraft } from './types'

interface AddonBuilderProps {
  draft: Partial<MenuItemDraft>
  updateDraft: (updates: Partial<MenuItemDraft>) => void
}

export default function AddonBuilder({ draft, updateDraft }: AddonBuilderProps) {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Extras & Add-ons</h2>
        <p className="mt-1 text-sm text-gray-500">Allow customers to customize their order with extra toppings, cheese, or sides.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-medium text-gray-900">Add-on Groups</h3>
          <button 
            type="button"
            onClick={() => {
              const newGroup = {
                id: Date.now().toString(),
                name: 'Extra Toppings',
                is_required: false,
                min_selections: 0,
                max_selections: null, // null means unlimited
                addons: [{ id: Date.now().toString() + '-1', name: '', price: 0 }]
              }
              updateDraft({ addon_groups: [...(draft.addon_groups || []), newGroup] })
            }}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
          >
            + Create Group
          </button>
        </div>

        <div className="space-y-4">
          {draft.addon_groups && draft.addon_groups.length > 0 ? (
            draft.addon_groups.map((group, groupIndex) => (
              <div key={group.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                <div className="flex flex-col gap-3 mb-4 border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-center">
                    <input 
                      type="text"
                      className="text-sm font-semibold bg-transparent border-b border-gray-300 focus:border-indigo-500 focus:outline-none px-1 py-1 text-gray-900 w-1/2"
                      value={group.name}
                      onChange={(e) => {
                        const newGroups = [...draft.addon_groups!]
                        newGroups[groupIndex].name = e.target.value
                        updateDraft({ addon_groups: newGroups })
                      }}
                      placeholder="Group Name (e.g. Extra Toppings)"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const newGroups = draft.addon_groups!.filter((_, idx) => idx !== groupIndex)
                        updateDraft({ addon_groups: newGroups })
                      }}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove Group
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 items-center">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={group.is_required}
                        onChange={(e) => {
                          const newGroups = [...draft.addon_groups!]
                          newGroups[groupIndex].is_required = e.target.checked
                          updateDraft({ addon_groups: newGroups })
                        }}
                      />
                      Required
                    </label>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span>Min:</span>
                      <input 
                        type="number" 
                        min="0"
                        className="w-16 px-2 py-1 text-gray-900 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        value={group.min_selections}
                        onChange={(e) => {
                          const newGroups = [...draft.addon_groups!]
                          newGroups[groupIndex].min_selections = parseInt(e.target.value) || 0
                          updateDraft({ addon_groups: newGroups })
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span>Max:</span>
                      <input 
                        type="number" 
                        min="1"
                        placeholder="Unlimited"
                        className="w-24 px-2 py-1 text-gray-900 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        value={group.max_selections === null ? '' : group.max_selections}
                        onChange={(e) => {
                          const newGroups = [...draft.addon_groups!]
                          newGroups[groupIndex].max_selections = e.target.value === '' ? null : (parseInt(e.target.value) || null)
                          updateDraft({ addon_groups: newGroups })
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.addons.map((addon, addonIndex) => (
                    <div key={addon.id} className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Add-on name (e.g. Extra Cheese)"
                        className="flex-1 block w-full rounded-md border-gray-300 py-1.5 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm text-gray-900"
                        value={addon.name}
                        onChange={(e) => {
                          const newGroups = [...draft.addon_groups!]
                          newGroups[groupIndex].addons[addonIndex].name = e.target.value
                          updateDraft({ addon_groups: newGroups })
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
                          value={addon.price || ''}
                          onChange={(e) => {
                            const newGroups = [...draft.addon_groups!]
                            newGroups[groupIndex].addons[addonIndex].price = parseFloat(e.target.value) || 0
                            updateDraft({ addon_groups: newGroups })
                          }}
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          const newGroups = [...draft.addon_groups!]
                          newGroups[groupIndex].addons = newGroups[groupIndex].addons.filter((_, idx) => idx !== addonIndex)
                          updateDraft({ addon_groups: newGroups })
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
                    const newGroups = [...draft.addon_groups!]
                    newGroups[groupIndex].addons.push({ id: Date.now().toString(), name: '', price: 0 })
                    updateDraft({ addon_groups: newGroups })
                  }}
                  className="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-800"
                >
                  + Add Item
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No add-ons yet</h3>
              <p className="mt-1 text-sm text-gray-500">Create groups like "Extra Toppings" or "Choice of Drink".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
