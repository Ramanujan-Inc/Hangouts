import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface HangoutPin {
  id: string
  title: string
  location_name?: string
  latitude: number
  longitude: number
  hangout_date?: string
  cover_photo_url?: string
  group_id?: string | null
}

interface MapComponentProps {
  pins: HangoutPin[]
  selectedPin: HangoutPin | null
  onSelectPin: (pin: HangoutPin) => void
  center?: [number, number]
  zoom?: number
}

// Controller to dynamically center and invalidate size on mount, tab switch, and resize
function MapController({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom || map.getZoom())
    map.invalidateSize()

    // Trigger sequential invalidateSize to handle transitions and dynamic container rendering
    const t1 = setTimeout(() => map.invalidateSize(), 50)
    const t2 = setTimeout(() => {
      map.invalidateSize()
      map.setView(center, zoom || map.getZoom())
    }, 250)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [map, center, zoom])

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [map])

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
    <div className="map-component-root">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={true}
        attributionControl={false}
        style={{ width: '100%', height: '100%', borderRadius: 'inherit', background: '#eef4fb' }}
      >
        <MapController center={mapCenter} zoom={zoom} />
        <ZoomControl position="bottomright" />
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

      <style jsx global>{`
        .map-component-root {
          width: 100%;
          height: 100%;
          border-radius: inherit;
          position: relative;
        }

        .map-component-root .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          border-radius: inherit;
          background: #eef4fb;
          z-index: 1;
        }

        /* Modernized Leaflet Zoom Controls */
        .map-component-root .leaflet-bottom.leaflet-right {
          margin-bottom: 20px;
          margin-right: 20px;
        }

        .map-component-root .leaflet-control-zoom {
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          border-radius: 14px !important;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(46, 42, 40, 0.12) !important;
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }

        .map-component-root .leaflet-control-zoom a {
          background: transparent !important;
          color: var(--color-text) !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 16px !important;
          font-weight: 700 !important;
          transition: all 0.2s ease;
        }

        .map-component-root .leaflet-control-zoom a:last-child {
          border-bottom: none !important;
        }

        .map-component-root .leaflet-control-zoom a:hover {
          background: #ffffff !important;
          color: var(--color-tangerine) !important;
        }

        /* Custom Leaflet Pin Markers */
        .custom-leaflet-marker-wrapper {
          background: transparent !important;
          border: none !important;
        }

        .custom-map-pin {
          position: relative;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .custom-map-pin:hover,
        .custom-map-pin.selected {
          transform: scale(1.15);
          z-index: 10;
        }

        .pin-avatar-ring {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid var(--color-blush, #e36888);
          background-color: white;
          overflow: hidden;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
        }

        .custom-map-pin.selected .pin-avatar-ring {
          border-color: var(--color-tangerine, #f08c21);
          box-shadow: 0 8px 24px rgba(242, 114, 89, 0.4);
        }

        .pin-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pin-arrow {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid var(--color-blush, #e36888);
          margin: -2px auto 0 auto;
        }

        .custom-map-pin.selected .pin-arrow {
          border-top-color: var(--color-tangerine, #f08c21);
        }
      `}</style>
    </div>
  )
}
