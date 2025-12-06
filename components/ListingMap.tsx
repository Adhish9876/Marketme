"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { MapPin } from "lucide-react"

// Fix for default marker icons in Next.js/Leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

type Props = {
  // In a real app, you need lat/lng. 
  // If you only have a city name, you need to use a Geocoding API.
  // For this demo, we default to a center point if coordinates aren't provided.
  lat?: number 
  lng?: number
  locationName: string
}

export default function ListingMap({ lat = 20.5937, lng = 78.9629, locationName }: Props) {
  return (
    <div className="h-[300px] w-full rounded-lg overflow-hidden border border-border z-0 relative">
      <MapContainer 
        center={[lat, lng]} 
        zoom={13} 
        scrollWheelZoom={false} 
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          // Using a muted, high-contrast map tile to fit your theme
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <Marker position={[lat, lng]} icon={icon}>
          <Popup>{locationName}</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}