'use client'

import { MenuItemDraft } from './types'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface ImageUploaderProps {
  draft: Partial<MenuItemDraft>
  updateDraft: (updates: Partial<MenuItemDraft>) => void
}

export default function ImageUploader({ draft, updateDraft }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()

  const handleUpload = async (file: File) => {
    if (!draft.restaurant_id) {
      toast.error('Restaurant ID is missing')
      return
    }
    
    setIsUploading(true)
    const toastId = toast.loading('Uploading image...')
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${draft.restaurant_id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath)

      updateDraft({ image_url: data.publicUrl })
      toast.success('Image uploaded successfully', { id: toastId })
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(error.message || 'Failed to upload image', { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        handleUpload(file)
      } else {
        toast.error('Please upload an image file')
      }
    }
  }

  const handleRemove = () => {
    updateDraft({ image_url: null })
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Upload Photo</h2>
        <p className="mt-1 text-sm text-gray-500">Items with high-quality photos get up to 3x more orders.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        {draft.image_url ? (
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200">
              <img 
                src={draft.image_url} 
                alt="Item preview" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button 
                  onClick={handleRemove}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-red-600 transition-colors"
                >
                  Remove Photo
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Looking good! This image meets quality standards.</span>
              <label className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer">
                Replace Image
                <input type="file" className="sr-only" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        ) : (
          <div 
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-4 flex text-sm text-gray-600 justify-center">
              <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                <span>Upload a file</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileUpload} />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">PNG, JPG, WEBP up to 5MB</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 flex gap-4">
        <div className="text-blue-500 mt-0.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <h4 className="text-sm font-medium text-blue-900">Photo Quality Tips</h4>
          <ul className="mt-2 text-sm text-blue-800 list-disc list-inside space-y-1">
            <li>Use good, natural lighting without harsh shadows.</li>
            <li>Keep the food centered in the frame.</li>
            <li>Avoid text, watermarks, or logos on the image.</li>
            <li>Recommended ratio is 4:3 (landscape).</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
