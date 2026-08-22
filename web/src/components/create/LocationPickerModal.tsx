import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Loader2, Check, Clock } from 'lucide-react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { Modal, Button } from '../ui'
import { api } from '../../lib/api'

interface RecentLocation {
  name: string
  address?: string
  lat: number
  lng: number
  placeId?: string
  date?: string
}

interface LocationPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectLocation: (
    name: string,
    lat: number,
    lng: number,
    formattedAddress?: string,
    placeId?: string
  ) => void
  currentLocationName?: string
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  currentLocationName = '',
}) => {
  const places = useMapsLibrary('places')
  const containerRef = useRef<HTMLDivElement>(null)
  const autocompleteRef = useRef<any>(null)
  const typedTextRef = useRef('')
  const onSelectLocationRef = useRef(onSelectLocation)
  onSelectLocationRef.current = onSelectLocation
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState<{
    name: string
    address?: string
    placeId?: string
    lat: number
    lng: number
  } | null>(null)
  const [resolving, setResolving] = useState(false)
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([])

  // Reset states on open & fetch recent hangout spots
  useEffect(() => {
    if (isOpen) {
      setSelectedPlaceInfo(null)
      typedTextRef.current = ''
      setResolving(false)

      const loadRecentLocations = async () => {
        try {
          const hangouts = await api.get<any[]>('/hangouts')
          if (Array.isArray(hangouts) && hangouts.length > 0) {
            const validSpots: RecentLocation[] = []
            const seenNames = new Set<string>()

            for (const h of hangouts) {
              if (
                h.location_name &&
                typeof h.latitude === 'number' &&
                typeof h.longitude === 'number' &&
                !isNaN(h.latitude) &&
                !isNaN(h.longitude)
              ) {
                const trimmed = h.location_name.trim()
                if (!seenNames.has(trimmed.toLowerCase())) {
                  seenNames.add(trimmed.toLowerCase())
                  validSpots.push({
                    name: trimmed,
                    address: h.formatted_address || undefined,
                    lat: h.latitude,
                    lng: h.longitude,
                    placeId: h.place_id || undefined,
                    date: h.hangout_date,
                  })
                }
              }
            }

            // Shuffle and pick up to 3 random spots from recent hangouts
            const shuffled = [...validSpots].sort(() => 0.5 - Math.random())
            setRecentLocations(shuffled.slice(0, 3))
          }
        } catch (err) {
          console.warn('Failed to load recent hangout locations:', err)
        }
      }
      loadRecentLocations()
    }
  }, [isOpen])

  // Mount Google Places PlaceAutocompleteElement Web Component ONCE per modal open
  useEffect(() => {
    if (!isOpen || !places || !containerRef.current) return

    const placesLib = places as any
    if (!placesLib?.PlaceAutocompleteElement) return

    const autocomplete = new placesLib.PlaceAutocompleteElement()
    autocompleteRef.current = autocomplete

    const handlePlaceSelect = async (event: any) => {
      try {
        setResolving(true)
        const place = event.place || event.detail?.place || (autocomplete as any).value
        if (!place) return

        try {
          if (typeof place.fetchFields === 'function') {
            await place.fetchFields({
              fields: ['displayName', 'formattedAddress', 'location', 'id'],
            })
          }
        } catch (fetchErr) {
          console.warn('Place fetchFields warning:', fetchErr)
        }

        // 1. Extract place name
        let name = ''
        if (typeof place.displayName === 'string' && place.displayName.trim()) {
          name = place.displayName.trim()
        } else if (place.displayName?.text && typeof place.displayName.text === 'string' && place.displayName.text.trim()) {
          name = place.displayName.text.trim()
        } else if (typeof (place as any).displayName === 'function') {
          name = (place as any).displayName()
        } else if (place.name && typeof place.name === 'string' && !place.name.startsWith('places/')) {
          name = place.name.trim()
        }

        // 2. Check value inside autocomplete element / shadowRoot input
        const shadowVal = (
          (autocomplete as any).value ||
          autocomplete.shadowRoot?.querySelector('input')?.value ||
          ''
        ).trim()

        if (!name && shadowVal) {
          name = shadowVal
        }

        // 3. Extract address & placeId
        let address = ''
        if (typeof place.formattedAddress === 'string' && place.formattedAddress.trim()) {
          address = place.formattedAddress.trim()
        }

        const placeId = place.id || place.place_id || place.placeId || undefined

        let lat: number | null = null
        let lng: number | null = null

        const loc = place.location || place.geometry?.location
        if (loc) {
          if (typeof loc.lat === 'function') {
            lat = Number(loc.lat())
          } else if (typeof loc.lat === 'number') {
            lat = loc.lat
          }

          if (typeof loc.lng === 'function') {
            lng = Number(loc.lng())
          } else if (typeof loc.lng === 'number') {
            lng = loc.lng
          }
        }

        // 4. If address or coordinates are missing and we have a placeId, geocode by placeId
        if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
          try {
            const geocoder = new (window as any).google.maps.Geocoder()
            if (placeId && (!address || lat == null || lng == null)) {
              const geoRes = await geocoder.geocode({ placeId })
              if (geoRes.results && geoRes.results[0]) {
                const first = geoRes.results[0]
                if (!address && first.formatted_address) {
                  address = first.formatted_address
                }
                if (!name && first.formatted_address) {
                  name = first.formatted_address.split(',')[0].trim()
                }
                if (lat == null || lng == null) {
                  const gLoc = first.geometry?.location
                  if (gLoc) {
                    lat = typeof gLoc.lat === 'function' ? Number(gLoc.lat()) : Number(gLoc.lat)
                    lng = typeof gLoc.lng === 'function' ? Number(gLoc.lng()) : Number(gLoc.lng)
                  }
                }
              }
            } else if ((lat == null || lng == null) && (address || name)) {
              const geoRes = await geocoder.geocode({ address: address || name })
              if (geoRes.results && geoRes.results[0]?.geometry?.location) {
                const gLoc = geoRes.results[0].geometry.location
                lat = typeof gLoc.lat === 'function' ? Number(gLoc.lat()) : Number(gLoc.lat)
                lng = typeof gLoc.lng === 'function' ? Number(gLoc.lng()) : Number(gLoc.lng)
                if (!address && geoRes.results[0]?.formatted_address) {
                  address = geoRes.results[0].formatted_address
                }
              }
            }
          } catch (gErr) {
            console.warn('Geocoder resolution warning:', gErr)
          }
        }

        // Fallback name if still empty
        if (!name) {
          name = address ? address.split(',')[0].trim() : (typedTextRef.current.trim() || 'Selected Location')
        }

        const finalName = name || currentLocationName || 'Selected Location'
        const finalLat = lat !== null && !isNaN(lat) ? lat : 0
        const finalLng = lng !== null && !isNaN(lng) ? lng : 0

        const resolved = {
          name: finalName,
          address: address || undefined,
          placeId,
          lat: finalLat,
          lng: finalLng,
        }

        setSelectedPlaceInfo(resolved)

        // Automatically commit selection and close
        onSelectLocationRef.current(resolved.name, resolved.lat, resolved.lng, resolved.address, resolved.placeId)
        onCloseRef.current()
      } catch (err) {
        console.error('Failed to retrieve place details from Google Places:', err)
      } finally {
        setResolving(false)
      }
    }

    const handleInput = (e: any) => {
      const val = e.target?.value || (autocomplete as any).value || ''
      typedTextRef.current = val
    }

    autocomplete.addEventListener('gmp-placeselect', handlePlaceSelect)
    autocomplete.addEventListener('input', handleInput)
    autocomplete.addEventListener('change', handleInput)
    containerRef.current.replaceChildren(autocomplete)

    return () => {
      autocomplete.removeEventListener('gmp-placeselect', handlePlaceSelect)
      autocomplete.removeEventListener('input', handleInput)
      autocomplete.removeEventListener('change', handleInput)
    }
  }, [isOpen, Boolean(places), currentLocationName])

  // Confirm whatever is in input / selected state
  const handleConfirmCurrentInput = async () => {
    if (selectedPlaceInfo) {
      onSelectLocationRef.current(
        selectedPlaceInfo.name,
        selectedPlaceInfo.lat,
        selectedPlaceInfo.lng,
        selectedPlaceInfo.address,
        selectedPlaceInfo.placeId
      )
      onCloseRef.current()
      return
    }

    // Try to get input text from autocomplete element or shadowRoot input
    let textToGeocode = typedTextRef.current.trim()
    if (!textToGeocode && autocompleteRef.current) {
      textToGeocode = (
        autocompleteRef.current.value ||
        autocompleteRef.current.shadowRoot?.querySelector('input')?.value ||
        ''
      ).trim()
    }

    if (!textToGeocode) {
      if (currentLocationName) {
        onClose()
        return
      }
      alert('Please type or select a location.')
      return
    }

    try {
      setResolving(true)
      let lat = 0
      let lng = 0
      let venueName = textToGeocode
      let formattedAddress = textToGeocode
      let placeId: string | undefined = undefined

      if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
        const geocoder = new (window as any).google.maps.Geocoder()
        const res = await geocoder.geocode({ address: textToGeocode })
        if (res.results && res.results[0]) {
          const first = res.results[0]
          formattedAddress = first.formatted_address || textToGeocode
          placeId = first.place_id || undefined
          venueName = textToGeocode

          if (first.geometry?.location) {
            lat = typeof first.geometry.location.lat === 'function' ? Number(first.geometry.location.lat()) : Number(first.geometry.location.lat)
            lng = typeof first.geometry.location.lng === 'function' ? Number(first.geometry.location.lng()) : Number(first.geometry.location.lng)
          }
        }
      }

      onSelectLocation(venueName, lat, lng, formattedAddress, placeId)
      onClose()
    } catch (geoErr) {
      console.warn('Geocoding manual input error:', geoErr)
      onSelectLocation(textToGeocode, 0, 0, textToGeocode, undefined)
      onClose()
    } finally {
      setResolving(false)
    }
  }

  if (!isOpen) return null

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    setResolving(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const name = currentLocationName || 'Current Location (GPS)'
        onSelectLocation(name, pos.coords.latitude, pos.coords.longitude)
        setResolving(false)
        onClose()
      },
      (err) => {
        setResolving(false)
        alert(`Failed to retrieve GPS location: ${err.message}`)
      }
    )
  }

  return (
    <Modal onClose={onClose} title="Select Location">
      <div className="location-modal-body">
        {/* Google Places Web Component Search Box */}
        <div className="search-input-row">
          <div ref={containerRef} className="autocomplete-container">
            {!places && (
              <div className="autocomplete-loading">
                <Loader2 size={16} className="spin-icon" />
                <span>Connecting to Google Places...</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick GPS Geolocation Button */}
        <button
          type="button"
          className="gps-action-btn"
          onClick={handleUseCurrentLocation}
          disabled={resolving}
        >
          <Navigation size={16} />
          <span>Use My Current GPS Location</span>
        </button>

        {/* 3 Random Recent Hangout Locations */}
        {recentLocations.length > 0 && (
          <div className="recent-spots-section">
            <div className="section-title">
              <Clock size={13} />
              <span>Recent Hangout Locations</span>
            </div>
            <div className="recent-spots-list">
              {recentLocations.map((spot, i) => (
                <div
                  key={i}
                  className="spot-result-row"
                  onClick={() => {
                    onSelectLocation(spot.name, spot.lat, spot.lng, spot.address, spot.placeId)
                    onClose()
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <MapPin size={18} className="spot-pin-icon" />
                  <div className="spot-details">
                    <div className="spot-name">{spot.name}</div>
                    {spot.address && spot.address !== spot.name && (
                      <div className="spot-desc">{spot.address}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-footer-btns">
          <Button
            variant="primary"
            fullWidth
            onClick={handleConfirmCurrentInput}
            disabled={resolving}
          >
            {resolving ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>Resolving Location...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Save & Select Location</span>
              </>
            )}
          </Button>
          <Button variant="secondary" fullWidth onClick={onClose} disabled={resolving}>
            Cancel
          </Button>
        </div>
      </div>

      <style jsx>{`
        .location-modal-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .autocomplete-container {
          width: 100%;
          min-height: 44px;
        }

        .autocomplete-container :global(gmp-place-autocomplete) {
          width: 100%;
          border-radius: 9999px;
          --gmp-place-autocomplete-search-icon-color: var(--color-blush);
        }

        .autocomplete-loading {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 9999px;
          background-color: var(--color-surface-container-low);
          color: var(--color-text-muted);
          font-size: 13px;
          font-family: var(--font-display);
        }

        .gps-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 9999px;
          background-color: var(--tint-sea);
          border: 1px solid var(--color-sea);
          color: var(--color-sea);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .gps-action-btn:hover:not(:disabled) {
          background-color: var(--color-sea);
          color: white;
        }

        .gps-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .recent-spots-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .section-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .recent-spots-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .spot-result-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
          background-color: var(--color-surface-container-low);
          border: 1px solid transparent;
        }

        .spot-result-row:hover {
          background-color: var(--color-surface-container);
          border-color: var(--color-surface-container-high);
          transform: translateY(-1px);
        }

        :global(.spot-pin-icon) {
          color: var(--color-blush);
          margin-top: 2px;
          flex-shrink: 0;
        }

        .spot-details {
          flex: 1;
        }

        .spot-name {
          font-weight: 700;
          font-size: 13px;
          color: var(--color-text);
        }

        .spot-desc {
          font-size: 11px;
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        .modal-footer-btns {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
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
    </Modal>
  )
}

