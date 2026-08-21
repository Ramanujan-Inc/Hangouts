import React from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface HangoutPin {
  id: string
  title: string
  location_name?: string
  latitude: number
  longitude: number
  hangout_date: string
  cover_photo_url?: string
}

interface MapComponentProps {
  pins: HangoutPin[]
  selectedPin: HangoutPin | null
  onSelectPin: (pin: HangoutPin) => void
  center?: [number, number]
  zoom?: number
}

// Component to dynamically re-center map when selected pin changes
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap()
  map.setView(center, map.getZoom())
  return null
}

const createCustomIcon = (coverUrl?: string, isSelected?: boolean) => {
  const imgUrl = coverUrl || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&auto=format&fit=crop&q=60'
  return L.divIcon({
    className: 'custom-leaflet-marker-wrapper',
    html: `
      <div class="custom-map-pin ${isSelected ? 'selected' : ''}">
        <div class="pin-avatar-ring">
          <img src="${imgUrl}" alt="pin" class="pin-avatar" />
        </div>
        <div class="pin-arrow"></div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 52],
  })
}

export default function MapComponent({
  pins,
  selectedPin,
  onSelectPin,
  center = [14.5995, 120.9842],
  zoom = 12,
}: MapComponentProps) {
  const mapCenter: [number, number] = selectedPin
    ? [Number(selectedPin.latitude), Number(selectedPin.longitude)]
    : center

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      scrollWheelZoom={true}
      attributionControl={false}
      style={{ width: '100%', height: '100%', borderRadius: '28px' }}
    >
      <ChangeView center={mapCenter} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      {pins.map((pin) => {
        const isSelected = selectedPin?.id === pin.id
        const customIcon = createCustomIcon(pin.cover_photo_url, isSelected)

        return (
          <Marker
            key={pin.id}
            position={[Number(pin.latitude), Number(pin.longitude)]}
            icon={customIcon}
            eventHandlers={{
              click: () => onSelectPin(pin),
            }}
          />
        )
      })}
    </MapContainer>
  )
}
