'use client'

import { useState } from 'react'
import { MenuItemDraft, defaultDraftItem } from './types'
import MenuStepper from './MenuStepper'
import CategoryPanel from './CategoryPanel'
import ItemForm from './ItemForm'
import PricingForm from './PricingForm'
import AddonBuilder from './AddonBuilder'
import ImageUploader from './ImageUploader'
import AvailabilityScheduler from './AvailabilityScheduler'
import ReviewPublishPanel from './ReviewPublishPanel'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { MenuItem } from '../MenuManager'

interface MenuBuilderProps {
  restaurantId: string
  existingItem?: MenuItem | null
  categories: string[]
  theme: { primaryColor: string }
  onClose: () => void
  onSave: (item: MenuItem) => void
}

const STEPS = [
  'Category',
  'Details',
  'Pricing',
  'Extras',
  'Photo',
  'Availability',
  'Review'
]

export default function MenuBuilder({ restaurantId, existingItem, categories, theme, onClose, onSave }: MenuBuilderProps) {
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [draft, setDraft] = useState<Partial<MenuItemDraft>>(
    existingItem 
      ? { 
          ...defaultDraftItem, 
          ...existingItem,
          restaurant_id: restaurantId,
          // Map mock fields that might not exist in real DB
          food_type: 'veg', // Mock fallback
          cuisine_tags: [],
        } 
      : { ...defaultDraftItem, restaurant_id: restaurantId }
  )

  const updateDraft = (updates: Partial<MenuItemDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      onClose()
    }
  }

  const handlePublish = async () => {
    setIsSubmitting(true)
    
    // Convert draft to DB compatible format (stripping mock fields for now)
    const dbItem = {
      restaurant_id: draft.restaurant_id,
      name: draft.name,
      description: draft.description,
      price: draft.price,
      category: draft.category,
      image_url: draft.image_url,
      is_available: draft.is_available,
      sort_order: draft.sort_order || 0,
      
      food_type: draft.food_type,
      cuisine_tags: draft.cuisine_tags || [],
      prep_time_minutes: draft.prep_time_minutes || 15,
      spice_level: draft.spice_level,
      sku: draft.sku,
      discounted_price: draft.discounted_price,
      dine_in_price: draft.dine_in_price,
      delivery_price: draft.delivery_price,
      variant_groups: draft.variant_groups || [],
      addon_groups: draft.addon_groups || [],
      schedule_type: draft.schedule_type || 'always',
      schedule_slots: draft.schedule_slots || []
    }

    try {
      if (draft.id) {
        // Update existing
        const { data, error } = await supabase
          .from('menu_items')
          .update(dbItem)
          .eq('id', draft.id)
          .select()
          .single()

        if (error) throw error
        toast.success('Item updated successfully!')
        onSave(data as MenuItem)
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('menu_items')
          .insert([dbItem])
          .select()
          .single()

        if (error) throw error
        toast.success('Item published to menu!')
        onSave(data as MenuItem)
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to save item. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {existingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-gray-500 italic">Draft saved locally</span>
        </div>
      </header>

      {/* Stepper */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-6 shrink-0">
        <div className="max-w-4xl mx-auto">
          <MenuStepper 
            currentStep={currentStep} 
            steps={STEPS} 
            onStepClick={(i) => setCurrentStep(i)} 
            theme={theme} 
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          {currentStep === 0 && (
            <CategoryPanel draft={draft} updateDraft={updateDraft} categories={categories} />
          )}
          {currentStep === 1 && (
            <ItemForm draft={draft} updateDraft={updateDraft} />
          )}
          {currentStep === 2 && (
            <PricingForm draft={draft} updateDraft={updateDraft} />
          )}
          {currentStep === 3 && (
            <AddonBuilder draft={draft} updateDraft={updateDraft} />
          )}
          {currentStep === 4 && (
            <ImageUploader draft={draft} updateDraft={updateDraft} />
          )}
          {currentStep === 5 && (
            <AvailabilityScheduler draft={draft} updateDraft={updateDraft} />
          )}
          {currentStep === 6 && (
            <ReviewPublishPanel draft={draft} onPublish={handlePublish} isSubmitting={isSubmitting} />
          )}
        </div>
      </div>

      {/* Sticky Footer */}
      {currentStep < STEPS.length - 1 && (
        <div className="shrink-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={handleBack}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg text-indigo-600 font-medium hover:bg-indigo-50 transition-colors"
              >
                Save as Draft
              </button>
              <button
                onClick={handleNext}
                className="px-8 py-2.5 rounded-lg text-white font-bold transition-colors shadow-sm hover:opacity-90"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
