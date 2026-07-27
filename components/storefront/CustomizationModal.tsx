'use client'

import { useState, useMemo } from 'react'
import type { MenuItem } from '@/app/(storefront)/page'
import { SelectedVariant, SelectedAddon } from './CartContext'

interface CustomizationModalProps {
  item: MenuItem
  isOpen: boolean
  onClose: () => void
  onAddToCart: (customizedItem: { selectedVariants: SelectedVariant[], selectedAddons: SelectedAddon[] }) => void
  primaryColor: string
}

export default function CustomizationModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
  primaryColor
}: CustomizationModalProps) {
  // State for selections
  const [selectedVariants, setSelectedVariants] = useState<Record<string, SelectedVariant>>(() => {
    // Auto-select the first option for each variant group as a default
    const initial: Record<string, SelectedVariant> = {}
    if (item.variant_groups) {
      item.variant_groups.forEach(group => {
        if (group.options && group.options.length > 0) {
          initial[group.id] = {
            groupId: group.id,
            groupName: group.name,
            variantName: group.options[0].name,
            price: group.options[0].price
          }
        }
      })
    }
    return initial
  })

  // Addons are multiple select, so we store an array of selected addons per group
  const [selectedAddons, setSelectedAddons] = useState<Record<string, SelectedAddon[]>>({})

  // Compute total extra price
  const extraPrice = useMemo(() => {
    let total = 0
    Object.values(selectedVariants).forEach(v => total += v.price)
    Object.values(selectedAddons).flat().forEach(a => total += a.price)
    return total
  }, [selectedVariants, selectedAddons])

  const handleVariantSelect = (group: any, option: any) => {
    setSelectedVariants(prev => ({
      ...prev,
      [group.id]: {
        groupId: group.id,
        groupName: group.name,
        variantName: option.name,
        price: option.price
      }
    }))
  }

  const handleAddonToggle = (group: any, addon: any) => {
    setSelectedAddons(prev => {
      const groupAddons = prev[group.id] || []
      const isSelected = groupAddons.some(a => a.addonName === addon.name)
      
      if (isSelected) {
        return {
          ...prev,
          [group.id]: groupAddons.filter(a => a.addonName !== addon.name)
        }
      } else {
        // If it's a strictly single-choice group, swap the selection instead of blocking
        if (group.max_selections === 1) {
          return {
            ...prev,
            [group.id]: [{ groupId: group.id, addonName: addon.name, price: addon.price }]
          }
        }

        // Enforce max selections if needed
        if (group.max_selections && groupAddons.length >= group.max_selections) {
          return prev // Cannot select more
        }
        return {
          ...prev,
          [group.id]: [...groupAddons, { groupId: group.id, addonName: addon.name, price: addon.price }]
        }
      }
    })
  }

  // Validate required addon groups
  const isValid = useMemo(() => {
    if (!item.addon_groups) return true
    for (const group of item.addon_groups) {
      if (group.is_required || (group.min_selections && group.min_selections > 0)) {
        const min = group.min_selections || 1
        const count = (selectedAddons[group.id] || []).length
        if (count < min) return false
      }
    }
    return true
  }, [item.addon_groups, selectedAddons])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div 
        className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 truncate pr-4">Customize {item.name}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-8">
          
          {/* Variants */}
          {item.variant_groups && item.variant_groups.map(group => (
            <div key={group.id} className="space-y-4">
              <div className="flex justify-between items-end">
                <h3 className="font-bold text-gray-900 text-lg">{group.name}</h3>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">Required</span>
              </div>
              
              <div className="space-y-3">
                {(group.options || []).map((option: any) => {
                  const isSelected = selectedVariants[group.id]?.variantName === option.name
                  return (
                    <label 
                      key={option.name} 
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-gray-900' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 bg-gray-900 rounded-full" />}
                        </div>
                        <span className={`font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                          {option.name}
                        </span>
                      </div>
                      <span className="text-gray-600 font-medium">
                        +₹{option.price}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Add-ons */}
          {item.addon_groups && item.addon_groups.map(group => {
            const min = group.min_selections || (group.is_required ? 1 : 0)
            const max = group.max_selections
            const selectedCount = (selectedAddons[group.id] || []).length
            const isFulfilled = selectedCount >= min
            
            return (
              <div key={group.id} className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{group.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {min > 0 ? `Choose at least ${min}` : 'Optional'}
                      {max ? ` (max ${max})` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                    isFulfilled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {isFulfilled ? 'Completed' : 'Required'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {(group.addons || []).map((addon: any) => {
                    const isSelected = (selectedAddons[group.id] || []).some(a => a.addonName === addon.name)
                    const isDisabled = !isSelected && max && max > 1 && selectedCount >= max
                    
                    return (
                      <label 
                        key={addon.name} 
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          isDisabled ? 'opacity-50 cursor-not-allowed border-gray-100' : 'cursor-pointer hover:border-gray-300'
                        } ${isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-100'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center ${
                            isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                            {addon.name}
                          </span>
                        </div>
                        <span className="text-gray-600 font-medium">
                          +₹{addon.price}
                        </span>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          disabled={isDisabled}
                          checked={isSelected}
                          onChange={() => handleAddonToggle(group, addon)}
                        />
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] shrink-0">
          <button
            onClick={() => {
              onAddToCart({
                selectedVariants: Object.values(selectedVariants),
                selectedAddons: Object.values(selectedAddons).flat()
              })
            }}
            disabled={!isValid}
            className="w-full py-3.5 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between px-6"
            style={{ backgroundColor: primaryColor }}
          >
            <span>{isValid ? 'Add to Cart' : 'Missing Requirements'}</span>
            <span>₹{(item.price + extraPrice).toFixed(2)}</span>
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </div>
  )
}
