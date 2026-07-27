'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default Leaflet icon issues in Next.js/Webpack
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
})

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void
  defaultLat?: number
  defaultLng?: number
}

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (p: L.LatLng) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng)
    },
  })

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1.5 })
    }
  }, [position, map])

  return position === null ? null : (
    <Marker position={position} icon={icon} />
  )
}

export default function LocationPicker({ onLocationSelect, defaultLat = 20.5937, defaultLng = 78.9629 }: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null)
  
  // Use a ref to prevent calling onLocationSelect repeatedly on mount if position is null
  const hasInitialized = useRef(false)

  const onLocationSelectRef = useRef(onLocationSelect)
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect
  }, [onLocationSelect])

  useEffect(() => {
    // Try to get user's current location on first mount
    if ('geolocation' in navigator && !hasInitialized.current) {
      hasInitialized.current = true
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng = new L.LatLng(pos.coords.latitude, pos.coords.longitude)
          setPosition(latlng)
          onLocationSelectRef.current(latlng.lat, latlng.lng)
        },
        (err) => {
          console.warn("Could not get geolocation:", err)
        }
      )
    }
  }, [])

  useEffect(() => {
    if (position) {
      onLocationSelectRef.current(position.lat, position.lng)
    }
  }, [position])

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng = new L.LatLng(pos.coords.latitude, pos.coords.longitude)
          setPosition(latlng)
        },
        (err) => {
          console.warn("Could not get geolocation:", err)
          alert("Could not access your location. Please ensure location permissions are enabled.")
        }
      )
    } else {
      alert("Geolocation is not supported by your browser.")
    }
  }

  // Generate a random ID for the map to ensure it completely remounts if needed,
  // but keeping it stable during the component lifecycle.
  const mapId = useRef(`map-${Math.random().toString(36).substring(2, 9)}`)

  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
      <MapContainer
        key={mapId.current}
        center={position || [defaultLat, defaultLng]}
        zoom={position ? 15 : 4}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
      
      <div className="absolute top-4 right-4 z-[400]">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            handleGetCurrentLocation()
          }}
          className="bg-white text-gray-900 px-3 py-2 rounded-lg shadow-md border border-gray-200 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2"
        >
          📍 Use Current Location
        </button>
      </div>
      
      {!position && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center z-[1000] pointer-events-none">
          <div className="bg-gray-900/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm shadow-lg pointer-events-auto">
            Tap the map to set your delivery location
          </div>
        </div>
      )}
    </div>
  )
}
