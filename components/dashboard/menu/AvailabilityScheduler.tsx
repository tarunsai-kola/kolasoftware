'use client'

import { MenuItemDraft } from './types'

interface AvailabilitySchedulerProps {
  draft: Partial<MenuItemDraft>
  updateDraft: (updates: Partial<MenuItemDraft>) => void
}

export default function AvailabilityScheduler({ draft, updateDraft }: AvailabilitySchedulerProps) {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Availability & Schedule</h2>
        <p className="mt-1 text-sm text-gray-500">Control when customers can order this item.</p>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        {/* Main Availability Toggle */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Available Today</h3>
            <p className="text-xs text-gray-500 mt-1">Quickly mark this item as out of stock if you run out.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={draft.is_available !== false}
              onChange={(e) => updateDraft({ is_available: e.target.checked })} 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Schedule Type */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Selling Schedule</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={`cursor-pointer p-4 border rounded-lg transition-colors flex items-start gap-3 ${
              draft.schedule_type === 'always' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <div className="flex items-center h-5">
                <input
                  type="radio"
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  checked={draft.schedule_type === 'always'}
                  onChange={() => updateDraft({ schedule_type: 'always' })}
                />
              </div>
              <div className="flex flex-col">
                <span className="block text-sm font-medium text-gray-900">Always Available</span>
                <span className="block text-xs text-gray-500 mt-1">Available during all restaurant operating hours</span>
              </div>
            </label>

            <label className={`cursor-pointer p-4 border rounded-lg transition-colors flex items-start gap-3 ${
              draft.schedule_type === 'scheduled' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <div className="flex items-center h-5">
                <input
                  type="radio"
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  checked={draft.schedule_type === 'scheduled'}
                  onChange={() => updateDraft({ schedule_type: 'scheduled' })}
                />
              </div>
              <div className="flex flex-col">
                <span className="block text-sm font-medium text-gray-900">Specific Times</span>
                <span className="block text-xs text-gray-500 mt-1">Only available during breakfast, lunch, or dinner</span>
              </div>
            </label>
          </div>
        </div>

        {/* Mock Schedule Builder (Shown if scheduled is selected) */}
        {draft.schedule_type === 'scheduled' && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">Time Slots</h4>
              <button className="text-xs text-indigo-600 font-medium hover:text-indigo-800">
                + Add Slot
              </button>
            </div>
            
            <div className="space-y-3">
              {['Monday - Sunday'].map(dayGroup => (
                <div key={dayGroup} className="flex items-center gap-3 bg-white p-3 rounded border border-gray-100 shadow-sm">
                  <div className="flex-1 text-sm font-medium text-gray-700">{dayGroup}</div>
                  <input type="time" defaultValue="08:00" className="text-sm border-gray-300 rounded px-2 py-1 border text-gray-900" />
                  <span className="text-gray-400">to</span>
                  <input type="time" defaultValue="11:30" className="text-sm border-gray-300 rounded px-2 py-1 border text-gray-900" />
                  <button className="text-red-500 p-1 hover:bg-red-50 rounded"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">Use this to configure items like "Breakfast only" or "Weekend Specials".</p>
          </div>
        )}
      </div>
    </div>
  )
}
