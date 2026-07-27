'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
})

const driverIcon = L.divIcon({
  className: 'custom-driver-icon',
  html: `<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
})

export default function DriverMap({ orders }: { orders: any[] }) {
  // Center on India or calculate bounds
  const defaultCenter: [number, number] = [20.5937, 78.9629]

  // Filter orders that have lat/lng
  const ordersWithLocation = orders.filter(o => o.delivery_lat != null && o.delivery_lng != null)

  const center = ordersWithLocation.length > 0
    ? [ordersWithLocation[0].delivery_lat, ordersWithLocation[0].delivery_lng] as [number, number]
    : defaultCenter

  const [driverLocation, setDriverLocation] = useState<L.LatLng | null>(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDriverLocation(new L.LatLng(pos.coords.latitude, pos.coords.longitude))
        },
        (err) => console.warn('Could not get driver location:', err),
        { enableHighAccuracy: true, maximumAge: 10000 }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  return (
    <div className="w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0 relative">
      <MapContainer
        center={center}
        zoom={ordersWithLocation.length > 0 ? 13 : 4}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {ordersWithLocation.map((order) => (
          <Marker 
            key={order.id} 
            position={[order.delivery_lat, order.delivery_lng]} 
            icon={icon}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold text-sm mb-1">{order.customer_name}</p>
                <p className="text-xs text-gray-600 mb-2">{order.delivery_address}</p>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium inline-block text-center w-full"
                >
                  Navigate
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
        {driverLocation && (
          <Marker position={driverLocation} icon={driverIcon}>
            <Popup>
              <div className="font-bold text-sm">You are here</div>
            </Popup>
          </Marker>
        )}

        {driverLocation && ordersWithLocation.map((order) => (
          <Polyline 
            key={`route-${order.id}`}
            positions={[driverLocation, [order.delivery_lat, order.delivery_lng]]} 
            color="#3b82f6"
            dashArray="5, 8"
            weight={3}
            opacity={0.6}
          />
        ))}

      </MapContainer>
    </div>
  )
}
