'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Rider {
  id: string
  name: string
  phone: string
  vehicle_info: string
  is_active: boolean
}

interface RidersClientProps {
  initialRiders: Rider[]
  restaurantId: string
  theme: any
}

export default function RidersClient({ initialRiders, restaurantId, theme }: RidersClientProps) {
  const supabase = createClient()
  const [riders, setRiders] = useState<Rider[]>(initialRiders)
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({ name: '', phone: '', vehicle_info: '', password: '', email: '' })

  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const res = await fetch('/api/admin/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          name: formData.name,
          phone: formData.phone,
          vehicle_info: formData.vehicle_info,
          password: formData.password,
          email: formData.email
        })
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to add rider')
      }

      setRiders([json.rider as Rider, ...riders])
      setIsAdding(false)
      setFormData({ name: '', phone: '', vehicle_info: '', password: '', email: '' })
      toast.success('Rider added!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to add rider')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleRiderStatus = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus
    setRiders(prev => prev.map(r => r.id === id ? { ...r, is_active: nextStatus } : r))
    
    const { error } = await supabase
      .from('delivery_riders')
      .update({ is_active: nextStatus })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update status')
      setRiders(prev => prev.map(r => r.id === id ? { ...r, is_active: currentStatus } : r)) // revert
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this rider?')) return
    
    setRiders(prev => prev.filter(r => r.id !== id))
    const { error } = await supabase.from('delivery_riders').delete().eq('id', id)
    
    if (error) {
      toast.error('Failed to delete rider')
      // simple reload on error to sync state
      window.location.reload()
    } else {
      toast.success('Rider removed')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delivery Riders</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your fleet of delivery personnel.</p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 shadow-sm"
            style={{ backgroundColor: theme.primaryColor || '#000' }}
          >
            {isAdding ? 'Cancel' : '+ Add Rider'}
          </button>
        </div>

        {isAdding && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Add New Rider</h2>
            <form onSubmit={handleAddRider} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  required
                  type="text"
                  className="w-full rounded-lg border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Phone Number *</label>
                <input
                  required
                  type="tel"
                  className="w-full rounded-lg border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Login Password *</label>
                <input
                  required
                  type="text"
                  placeholder="Create a password for the rider"
                  className="w-full rounded-lg border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Rider Email (Optional)</label>
                <input
                  type="email"
                  placeholder="Where to send the login credentials"
                  className="w-full rounded-lg border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Vehicle Info (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Honda Activa - AP 09 BK 1234"
                  className="w-full rounded-lg border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  value={formData.vehicle_info}
                  onChange={e => setFormData({ ...formData, vehicle_info: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 mt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Rider'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          {riders.length === 0 ? (
            <div className="p-8 text-center">
              <span className="text-4xl">🛵</span>
              <h3 className="mt-4 text-sm font-semibold text-gray-900">No riders yet</h3>
              <p className="mt-1 text-sm text-gray-500">Add a rider to start assigning deliveries.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rider</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {riders.map(rider => (
                  <tr key={rider.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{rider.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rider.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rider.vehicle_info || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => toggleRiderStatus(rider.id, rider.is_active)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          rider.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {rider.is_active ? 'Active' : 'Offline'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleDelete(rider.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
