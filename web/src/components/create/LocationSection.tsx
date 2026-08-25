import React, { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Navigation, Search, Edit3, Loader2 } from 'lucide-react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'

// Dynamically import client-only Leaflet map picker
const LocationMapPicker = dynamic(() => import('./LocationMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="map-loading-placeholder">
      <Loader2 size={20} className="spin-icon" />
      <span>Loading interactive map...</span>
    </div>
  ),
})

interface LocationSectionProps {
  locationName: string
  formattedAddress: string
  latitude: number | null
  longitude: number | null
  placeId: string
  onLocationChange: (data: {
    locationName: string
    formattedAddress?: string
    latitude?: number
    longitude?: number
    placeId?: string
  }) => void
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  locationName,
  formattedAddress,
  latitude,
  longitude,
  placeId,
  onLocationChange,
}) => {
  const placesLib = useMapsLibrary('places')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [resolving, setResolving] = React.useState(false)

  // Attach Google Places Autocomplete to the search input
  useEffect(() => {
    if (typeof window === 'undefined' || !placesLib || !searchInputRef.current) return

    try {
      const places = (window as any).google?.maps?.places
      if (!places?.Autocomplete) return

      const autocomplete = new places.Autocomplete(searchInputRef.current, {
        fields: ['name', 'formatted_address', 'geometry', 'place_id', 'address_components'],
      })
      autocompleteRef.current = autocomplete

      const listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (!place || !place.geometry?.location) {
          const rawText = searchInputRef.current?.value.trim() || ''
          if (rawText) {
            onLocationChange({
              locationName: rawText,
              formattedAddress: rawText,
              latitude: latitude || undefined,
              longitude: longitude || undefined,
              placeId: placeId || undefined,
            })
          }
          return
        }

        const lat =
          typeof place.geometry.location.lat === 'function'
            ? Number(place.geometry.location.lat())
            : Number(place.geometry.location.lat)
        const lng =
          typeof place.geometry.location.lng === 'function'
            ? Number(place.geometry.location.lng())
            : Number(place.geometry.location.lng)

        const name =
          place.name ||
          (place.formatted_address ? place.formatted_address.split(',')[0].trim() : '') ||
          'Selected Location'
        const address = place.formatted_address || ''
        const pId = place.place_id || undefined

        // Clear search input so it stays clean for next search
        if (searchInputRef.current) {
          searchInputRef.current.value = ''
        }

        onLocationChange({
          locationName: name,
          formattedAddress: address,
          latitude: lat,
          longitude: lng,
          placeId: pId,
        })
      })

      return () => {
        if (listener && (window as any).google?.maps?.event?.removeListener) {
          (window as any).google.maps.event.removeListener(listener)
        }
      }
    } catch (err) {
      console.warn('Failed to initialize Google Places Autocomplete:', err)
    }
  }, [placesLib, onLocationChange, latitude, longitude, placeId])

  // Reverse geocoding helper
  const reverseGeocode = async (lat: number, lng: number) => {
    setResolving(true)
    let foundName = ''
    let foundAddress = ''
    let foundPlaceId: string | undefined = undefined

    // Helper to strip Plus Codes (e.g. "G5P3+H5W, ") from addresses and venue names
    const isPlusCode = (str: string) =>
      /^[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}$/i.test(str.trim()) || (str.includes('+') && !str.includes(' '))

    const cleanAddress = (raw: string) =>
      raw.replace(/^[A-Z0-9]{2,8}\+[A-Z0-9]{2,4},\s*/i, '').trim()

    // 1. Google Maps Geocoder API
    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      try {
        const geocoder = new (window as any).google.maps.Geocoder()
        const geoRes = await geocoder.geocode({ location: { lat, lng } })
        if (geoRes.results && geoRes.results.length > 0) {
          const first = geoRes.results[0]
          const rawAddress = first.formatted_address || ''
          foundAddress = cleanAddress(rawAddress) || rawAddress
          foundPlaceId = first.place_id || undefined

          // Check for POI / establishment / landmark
          const poi = first.address_components?.find((c: any) =>
            c.types?.includes('point_of_interest') ||
            c.types?.includes('establishment') ||
            c.types?.includes('premise') ||
            c.types?.includes('natural_feature')
          )
          if (poi && poi.long_name && !isPlusCode(poi.long_name)) {
            foundName = poi.long_name
          } else {
            // Check for street route or neighborhood
            const streetOrArea = first.address_components?.find((c: any) =>
              c.types?.includes('route') ||
              c.types?.includes('neighborhood') ||
              c.types?.includes('sublocality')
            )
            if (streetOrArea && streetOrArea.long_name && !isPlusCode(streetOrArea.long_name)) {
              foundName = streetOrArea.long_name
            } else if (foundAddress) {
              const parts = foundAddress.split(',')
              foundName = parts[0].trim()
            }
          }
        }
      } catch (gErr) {
        console.warn('Google reverse geocode warning:', gErr)
      }
    }

    // 2. OpenStreetMap Nominatim Fallback
    if (!foundName || !foundAddress || isPlusCode(foundName)) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          { headers: { 'Accept-Language': 'en' } }
        )
        if (res.ok) {
          const data = await res.json()
          const osmName =
            data.name ||
            data.address?.amenity ||
            data.address?.building ||
            data.address?.tourism ||
            data.address?.shop ||
            data.address?.leisure ||
            data.address?.road ||
            data.display_name?.split(',')[0]
          if ((!foundName || isPlusCode(foundName)) && osmName) foundName = osmName
          if (!foundAddress && data.display_name) foundAddress = data.display_name
        }
      } catch (osmErr) {
        console.warn('OSM reverse geocode warning:', osmErr)
      }
    }

    if (isPlusCode(foundName)) {
      foundName = foundAddress ? foundAddress.split(',')[0].trim() : ''
    }

    const finalName =
      foundName ||
      (foundAddress ? foundAddress.split(',')[0].trim() : `Pinned Spot (${lat.toFixed(4)}, ${lng.toFixed(4)})`)

    onLocationChange({
      locationName: finalName,
      formattedAddress: foundAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      latitude: lat,
      longitude: lng,
      placeId: foundPlaceId,
    })
    setResolving(false)
  }

  // Handle map click/drag
  const handleMapPinChange = (lat: number, lng: number) => {
    reverseGeocode(lat, lng)
  }

  // Use My Current Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    setResolving(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        reverseGeocode(pos.coords.latitude, pos.coords.longitude)
      },
      (err) => {
        setResolving(false)
        alert(`Failed to retrieve location: ${err.message}`)
      }
    )
  }

  return (
    <div className="location-section-container">
      <div className="section-header-row">
        <label className="field-label">
          <MapPin size={16} /> Location
        </label>
        <button
          type="button"
          className="gps-pill-btn"
          onClick={handleUseCurrentLocation}
          disabled={resolving}
          title="Use current location"
        >
          {resolving ? <Loader2 size={12} className="spin-icon" /> : <Navigation size={12} />}
          <span>Use My Location</span>
        </button>
      </div>

      {/* 1. Search Venue or Address */}
      <div className="search-bar-wrapper">
        <Search size={16} className="search-icon" />
        <input
          ref={searchInputRef}
          type="text"
          className="location-search-input"
          placeholder="Search venue or address on Google Maps..."
        />
      </div>

      {/* 2. Interactive Map */}
      <div className="map-picker-wrapper">
        <LocationMapPicker
          lat={latitude}
          lng={longitude}
          onLocationChange={handleMapPinChange}
        />
      </div>

      {/* 3. Editable Location Name */}
      <div className="location-name-card">
        <div className="name-header-row">
          <label className="name-field-label">
            <Edit3 size={13} className="edit-icon" />
            <span>Location / Venue Name</span>
          </label>
        </div>
        <input
          type="text"
          className="location-name-input"
          value={locationName}
          onChange={(e) =>
            onLocationChange({
              locationName: e.target.value,
              formattedAddress,
              latitude: latitude || undefined,
              longitude: longitude || undefined,
              placeId,
            })
          }
          placeholder="e.g. Wildflour Cafe, Sam's Rooftop, Secret Treehouse"
        />

        {/* 4. Formatted Address Preview */}
        {formattedAddress && formattedAddress !== locationName && (
          <div className="address-sub-row">
            <MapPin size={13} className="address-sub-icon" />
            <span className="address-sub-text">{formattedAddress}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .location-section-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 4px;
        }

        .section-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .field-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 15px;
          color: var(--color-text);
        }

        .gps-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 9999px;
          background-color: var(--tint-sea);
          border: 1px solid var(--color-sea);
          color: var(--color-sea);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .gps-pill-btn:hover:not(:disabled) {
          background-color: var(--color-sea);
          color: white;
        }

        .gps-pill-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .search-bar-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        :global(.search-icon) {
          position: absolute;
          left: 14px;
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .location-search-input {
          width: 100%;
          padding: 11px 16px 11px 40px;
          border-radius: 14px;
          border: 1.5px solid var(--color-surface-container-high);
          background-color: var(--color-surface-container-lowest);
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--color-text);
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .location-search-input:focus {
          border-color: var(--color-blush);
          box-shadow: 0 0 0 3px var(--tint-blush);
        }

        .location-search-input::placeholder {
          color: var(--color-text-muted);
          opacity: 0.75;
        }

        .map-picker-wrapper {
          width: 100%;
          border-radius: 18px;
          overflow: hidden;
        }

        :global(.map-loading-placeholder) {
          width: 100%;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background-color: var(--color-surface-container-low);
          border-radius: 18px;
          color: var(--color-text-muted);
          font-family: var(--font-display);
          font-size: 13px;
        }

        .location-name-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px 14px;
          border-radius: 14px;
          background-color: var(--color-surface-container-low);
          border: 1px solid var(--color-surface-container-high);
        }

        .name-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .name-field-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        :global(.edit-icon) {
          color: var(--color-tangerine);
        }

        .location-name-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid var(--color-surface-container-high);
          background-color: var(--color-surface-container-lowest);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }

        .location-name-input::placeholder {
          color: var(--color-text-muted);
          opacity: 0.75;
        }

        .location-name-input:focus {
          border-color: var(--color-blush);
          box-shadow: 0 0 0 3px var(--tint-blush);
        }

        .address-sub-row {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin-top: 2px;
          padding-left: 2px;
        }

        :global(.address-sub-icon) {
          color: var(--color-sea);
          margin-top: 2px;
          flex-shrink: 0;
        }

        .address-sub-text {
          font-size: 12px;
          color: var(--color-text-muted);
          line-height: 1.35;
        }

        :global(.spin-icon) {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
