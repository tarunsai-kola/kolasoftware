'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { signOut } from '@/app/actions/auth'
import { saveCustomerProfile } from '@/app/actions/customer'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface ProfileDropdownProps {
  name: string
  email: string
  phone: string
  address: string | null
}

export default function ProfileDropdown({ name, email, phone, address }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  const [editName, setEditName] = useState(name)
  const [editPhone, setEditPhone] = useState(phone)
  
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsEditing(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSave = () => {
    if (!editName.trim()) { toast.error('Please enter your name'); return }
    if (!editPhone.trim() || editPhone.replace(/\D/g, '').length < 10) { toast.error('Please enter a valid 10-digit phone number'); return }

    startTransition(async () => {
      const result = await saveCustomerProfile(editName.trim(), editPhone.trim())
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Profile updated successfully')
        setIsEditing(false)
        router.refresh() // Refresh the server component to get the new data
      }
    })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => { setIsOpen(!isOpen); setIsEditing(false); }}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 focus:outline-none"
        aria-label="Profile"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl border border-gray-100 bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-top-2 z-50">
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">My Profile</h3>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Edit</button>
            ) : (
              <button onClick={() => setIsEditing(false)} className="text-xs font-semibold text-gray-500 hover:text-gray-700">Cancel</button>
            )}
          </div>

          {!isEditing ? (
            <div className="mb-4 space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Name</p>
                <p className="text-sm font-semibold text-gray-900">{name || 'Not set'}</p>
              </div>
              
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Email</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{email || 'Not set'}</p>
              </div>
              
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Phone</p>
                <p className="text-sm font-semibold text-gray-900">{phone || 'Not set'}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Address</p>
                <p className="text-sm font-semibold text-gray-900 line-clamp-2">{address || 'No default address saved'}</p>
              </div>
            </div>
          ) : (
            <div className="mb-4 space-y-3">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-400 block mb-1">Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-400"
                  disabled={isPending}
                />
              </div>
              
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Email</p>
                <p className="text-sm font-semibold text-gray-500 truncate">{email || 'Not set'}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-400 block mb-1">Phone</label>
                <input 
                  type="text" 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-400"
                  disabled={isPending}
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSave}
                  disabled={isPending}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
          
          <div className="border-t border-gray-100 pt-3">
            <form action={signOut}>
              <button 
                type="submit" 
                className="flex w-full items-center justify-center rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
