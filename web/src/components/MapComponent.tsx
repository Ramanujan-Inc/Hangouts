import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../context/ThemeContext'
import { CARTO_VOYAGER_TILE_URL, CARTO_ATTRIBUTION } from '../lib/map'

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
  const imgUrl = coverUrl || '/images/covers/hangout-default.jpg'
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
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

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
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 'inherit',
          background: isDark ? '#141110' : '#eef4fb',
        }}
      >
        <MapController center={mapCenter} zoom={zoom} />
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution={CARTO_ATTRIBUTION}
          url={CARTO_VOYAGER_TILE_URL}
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
          background: var(--color-background);
          z-index: 1;
        }

        /* Modernized Leaflet Zoom Controls */
        .map-component-root .leaflet-bottom.leaflet-right {
          margin-bottom: 20px;
          margin-right: 20px;
        }

        .map-component-root .leaflet-control-zoom {
          border: 1px solid var(--color-surface-container-high) !important;
          border-radius: 14px !important;
          overflow: hidden;
          box-shadow: var(--shadow-ambient) !important;
          background: var(--color-surface-container-lowest) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }

        .map-component-root .leaflet-control-zoom a {
          background: transparent !important;
          color: var(--color-text) !important;
          border-bottom: 1px solid var(--color-surface-container-high) !important;
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
          background: var(--color-surface-container-low) !important;
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
