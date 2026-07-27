'use client'

import { MenuItemDraft } from './types'

interface ReviewPublishPanelProps {
  draft: Partial<MenuItemDraft>
  onPublish: () => void
  isSubmitting: boolean
}

export default function ReviewPublishPanel({ draft, onPublish, isSubmitting }: ReviewPublishPanelProps) {
  // Validation
  const errors = []
  if (!draft.name) errors.push('Item Name is missing')
  if (!draft.category) errors.push('Category is missing')
  if (!draft.price || draft.price <= 0) errors.push('Price must be greater than 0')
  if (!draft.image_url) errors.push('Photo is missing (Recommended)')

  const isValid = errors.filter(e => !e.includes('(Recommended)')).length === 0

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Review & Publish</h2>
        <p className="mt-2 text-sm text-gray-500">This is how your item will appear to customers on your menu.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Preview Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden flex flex-col h-full transform transition-all hover:-translate-y-1">
          {draft.image_url ? (
            <div className="relative aspect-[4/3] w-full">
              <img src={draft.image_url} alt={draft.name || 'Item'} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="relative aspect-[4/3] w-full bg-gray-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          )}
          
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {/* Food Type Indicator */}
                {draft.food_type && (
                  <div className="flex items-center justify-center shrink-0">
                    {draft.food_type === 'veg' && (
                      <div className="w-4 h-4 border border-green-600 flex items-center justify-center p-[2px]">
                        <div className="w-full h-full bg-green-600 rounded-full"></div>
                      </div>
                    )}
                    {draft.food_type === 'non-veg' && (
                      <div className="w-4 h-4 border border-red-600 flex items-center justify-center p-[2px]">
                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-red-600"></div>
                      </div>
                    )}
                    {draft.food_type === 'egg' && (
                      <div className="w-4 h-4 border border-yellow-500 flex items-center justify-center p-[2px]">
                        <div className="w-2 h-2.5 bg-yellow-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                )}
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{draft.name || 'Item Name'}</h3>
              </div>
            </div>
            
            <div className="text-lg font-bold text-gray-900 mb-3">
              ₹{draft.price || '0.00'}
            </div>
            
            <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
              {draft.description || 'No description provided.'}
            </p>
            
            <button className="w-full py-2.5 rounded-lg border border-red-500 text-red-500 font-bold hover:bg-red-50 transition-colors uppercase text-sm tracking-wider">
              Add +
            </button>
          </div>
        </div>

        {/* Validation & Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Readiness Check</h3>
            
            {errors.length === 0 ? (
              <div className="flex items-center gap-3 text-green-700 bg-green-50 p-4 rounded-lg">
                <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <p className="text-sm font-medium">Looks perfect! Ready to publish.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {errors.map((error, idx) => {
                  const isWarning = error.includes('(Recommended)')
                  return (
                    <li key={idx} className={`flex items-start gap-3 p-3 rounded-lg text-sm font-medium ${
                      isWarning ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'
                    }`}>
                      {isWarning ? (
                        <svg className="w-5 h-5 shrink-0 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      ) : (
                        <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                      <span>{error}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">Summary</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-gray-500">Category:</span>
              <span className="font-medium text-gray-900 text-right">{draft.category || '-'}</span>
              <span className="text-gray-500">Food Type:</span>
              <span className="font-medium text-gray-900 text-right capitalize">{draft.food_type || '-'}</span>
              <span className="text-gray-500">Availability:</span>
              <span className="font-medium text-green-600 text-right">{draft.is_available ? 'Available' : 'Out of Stock'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6">
        <button
          onClick={onPublish}
          disabled={!isValid || isSubmitting}
          className="w-full sm:w-auto mx-auto block px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Publishing...' : 'Publish Item to Menu'}
        </button>
      </div>
    </div>
  )
}
