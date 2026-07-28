'use client'

import { useEffect, useState } from 'react'

export interface WhatsAppButtonProps {
  whatsappNumber: string | null
  restaurantName: string
}

export default function WhatsAppButton({ whatsappNumber, restaurantName }: WhatsAppButtonProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !whatsappNumber) return null

  // Ensure the number is digits only
  const cleanNumber = whatsappNumber.replace(/\D/g, '')
  if (!cleanNumber) return null

  const message = `Hello, I am here to order food from ${restaurantName}`
  const encodedMessage = encodeURIComponent(message)
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300 sm:bottom-6 sm:right-6"
      aria-label="Contact us on WhatsApp"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-8 w-8"
      >
        <path d="M12.031 21.922c-1.605 0-3.122-.43-4.475-1.24l-4.996 1.31 1.332-4.872a9.92 9.92 0 01-1.34-5.048c0-5.467 4.453-9.922 9.92-9.922 5.465 0 9.919 4.455 9.919 9.922 0 5.467-4.454 9.92-9.919 9.92h-4.441zm0-18.152c-4.532 0-8.223 3.69-8.223 8.23 0 1.542.428 2.99 1.171 4.225l-1.023 3.744 3.826-1.002a8.214 8.214 0 004.249 1.178c4.53 0 8.221-3.69 8.221-8.23 0-4.54-3.691-8.23-8.221-8.23v.085zm4.516 11.238c-.248-.124-1.468-.724-1.696-.807-.227-.083-.393-.124-.559.124-.165.248-.638.807-.783.971-.144.165-.29.186-.538.062-.247-.124-1.047-.386-1.996-1.23-.738-.656-1.236-1.467-1.38-1.715-.144-.248-.016-.382.109-.505.112-.11.248-.288.371-.433.124-.144.165-.248.248-.413.083-.165.041-.31-.021-.433-.062-.124-.559-1.348-.765-1.844-.201-.482-.405-.417-.559-.425l-.478-.01c-.165 0-.434.062-.66.31-.227.248-.867.847-.867 2.065s.888 2.396 1.011 2.561c.124.165 1.745 2.663 4.227 3.733.59.255 1.051.408 1.41.523.592.188 1.13.161 1.554.098.473-.07 1.468-.6 1.674-1.178.207-.579.207-1.075.145-1.178-.062-.104-.228-.166-.476-.29z" />
      </svg>
    </a>
  )
}
