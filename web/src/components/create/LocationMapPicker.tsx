import React, { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CARTO_VOYAGER_TILE_URL, CARTO_ATTRIBUTION } from '../../lib/map'

interface LocationMapPickerProps {
  lat: number | null
  lng: number | null
  onLocationChange: (lat: number, lng: number) => void
  defaultCenter?: [number, number]
  defaultZoom?: number
}

// Controller to smoothly pan map when coordinates change externally
function MapRecenterController({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap()

  useEffect(() => {
    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.8 })
      map.invalidateSize()
    }
  }, [map, lat, lng])

  // Invalidate map size on initial mount & container resize
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 100)
    const t2 = setTimeout(() => map.invalidateSize(), 300)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [map])

  return null
}

// Handles user clicking anywhere on map to drop a pin
function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Custom Leaflet DivIcon for the pinned location
const createPinIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-picker-pin-wrapper',
    html: `
      <div class="map-picker-pin">
        <div class="picker-pin-head">
          <div class="picker-pin-dot"></div>
        </div>
        <div class="picker-pin-point"></div>
        <div class="picker-pin-shadow"></div>
      </div>
    `,
    iconSize: [36, 46],
    iconAnchor: [18, 44],
  })
}

export default function LocationMapPicker({
  lat,
  lng,
  onLocationChange,
  defaultCenter = [14.5995, 120.9842],
  defaultZoom = 13,
}: LocationMapPickerProps) {
  const markerRef = useRef<L.Marker | null>(null)
  const pinIcon = useMemo(() => createPinIcon(), [])

  const currentCenter: [number, number] =
    lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)
      ? [lat, lng]
      : defaultCenter

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker != null) {
          const pos = marker.getLatLng()
          onLocationChange(pos.lat, pos.lng)
        }
      },
    }),
    [onLocationChange]
  )

  return (
    <div className="location-map-picker-root">
      <MapContainer
        center={currentCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        attributionControl={false}
        style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
      >
        <TileLayer
          attribution={CARTO_ATTRIBUTION}
          url={CARTO_VOYAGER_TILE_URL}
        />

        <MapRecenterController lat={lat} lng={lng} />
        <MapClickHandler onLocationChange={onLocationChange} />

        {lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && (
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={[lat, lng]}
            icon={pinIcon}
            ref={markerRef}
          />
        )}
      </MapContainer>

      <div className="map-hint-overlay">
        <span>Click or drag pin to position</span>
      </div>

      <style jsx global>{`
        .location-map-picker-root {
          width: 100%;
          height: 220px;
          border-radius: 18px;
          position: relative;
          overflow: hidden;
          border: 1px solid var(--color-surface-container-high);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
          background-color: var(--color-background);
        }

        .location-map-picker-root .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          border-radius: inherit;
          cursor: crosshair;
        }

        .map-hint-overlay {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(46, 42, 40, 0.75);
          backdrop-filter: blur(8px);
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 9999px;
          pointer-events: none;
          z-index: 1000;
          white-space: nowrap;
        }

        .custom-leaflet-picker-pin-wrapper {
          background: transparent !important;
          border: none !important;
        }

        .map-picker-pin {
          position: relative;
          width: 36px;
          height: 44px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .picker-pin-head {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-blush), var(--color-tangerine));
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(242, 114, 89, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
          animation: pinBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .picker-pin-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #ffffff;
        }

        .picker-pin-point {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 10px solid var(--color-tangerine);
          margin-top: -3px;
          position: relative;
          z-index: 1;
        }

        .picker-pin-shadow {
          width: 14px;
          height: 4px;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 50%;
          margin-top: -2px;
          filter: blur(1px);
        }

        @keyframes pinBounce {
          0% {
            transform: translateY(-16px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
