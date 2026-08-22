import React, { useState } from 'react'
import { MapPin, Navigation, ChevronDown } from 'lucide-react'
import { Modal, Button, Badge } from '../ui'
import { SuggestedSpot, SUGGESTED_SPOTS } from './types'

interface LocationPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectLocation: (name: string, lat: number, lng: number) => void
  currentLocationName?: string
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  currentLocationName = '',
}) => {
  const [searchLocationQuery, setSearchLocationQuery] = useState('')
  const [customCoordsMode, setCustomCoordsMode] = useState(false)
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')

  if (!isOpen) return null

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const name = currentLocationName || 'Current Location (GPS)'
        onSelectLocation(name, pos.coords.latitude, pos.coords.longitude)
        onClose()
      },
      (err) => {
        alert(`Failed to retrieve GPS location: ${err.message}`)
      }
    )
  }

  const handleSelectSuggestedSpot = (spot: SuggestedSpot) => {
    onSelectLocation(spot.name, spot.lat, spot.lng)
    onClose()
  }

  const handleApplyManualCoords = () => {
    const parsedLat = parseFloat(manualLat)
    const parsedLng = parseFloat(manualLng)
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      alert('Please enter valid numerical latitude and longitude.')
      return
    }
    const name =
      currentLocationName || `Coordinates: ${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)}`
    onSelectLocation(name, parsedLat, parsedLng)
    onClose()
  }

  const filteredSpots = SUGGESTED_SPOTS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchLocationQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchLocationQuery.toLowerCase())
  )

  return (
    <Modal onClose={onClose} title="Select Location & Coordinates">
      <div className="location-modal-body">
        {/* Search Bar */}
        <div className="search-input-row">
          <input
            type="text"
            className="pill-input"
            placeholder="Search place name (e.g. Ramen Nagi, BGC)"
            value={searchLocationQuery}
            onChange={(e) => setSearchLocationQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Quick GPS Geolocation Button */}
        <button type="button" className="gps-action-btn" onClick={handleUseCurrentLocation}>
          <Navigation size={16} />
          <span>Use My Current GPS Location</span>
        </button>

        {/* Popular Suggested Hangout Spots */}
        <div className="section-title">Suggested Places with Coordinates</div>
        <div className="suggested-results">
          {filteredSpots.map((spot, i) => (
            <div
              key={i}
              className="spot-result-row"
              onClick={() => handleSelectSuggestedSpot(spot)}
              role="button"
              tabIndex={0}
            >
              <MapPin size={18} className="spot-pin-icon" />
              <div className="spot-details">
                <div className="spot-name">{spot.name}</div>
                <div className="spot-desc">{spot.desc}</div>
                <div className="spot-coords-tag">
                  <Badge variant="neutral" size="sm">
                    {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Manual Coordinates Toggle */}
        <div className="custom-coords-toggle">
          <button
            type="button"
            className="toggle-link"
            onClick={() => setCustomCoordsMode(!customCoordsMode)}
          >
            <span>
              {customCoordsMode
                ? 'Hide custom coordinate inputs'
                : 'Enter custom latitude / longitude manually'}
            </span>
            <ChevronDown
              size={14}
              style={{
                transform: customCoordsMode ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </button>

          {customCoordsMode && (
            <div className="custom-coords-box">
              <div className="coords-inputs-row">
                <div className="coord-field">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="pill-input"
                    placeholder="e.g. 14.5517"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                  />
                </div>
                <div className="coord-field">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="pill-input"
                    placeholder="e.g. 121.0505"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                size="small"
                variant="secondary"
                fullWidth
                onClick={handleApplyManualCoords}
              >
                Apply Coordinates
              </Button>
            </div>
          )}
        </div>

        <div className="modal-footer-btns">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <style jsx>{`
        .location-modal-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
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

        .gps-action-btn:hover {
          background-color: var(--color-sea);
          color: white;
        }

        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }

        .suggested-results {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 240px;
          overflow-y: auto;
        }

        .spot-result-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: background-color 0.15s;
          background-color: var(--color-surface-container-low);
        }

        .spot-result-row:hover {
          background-color: var(--color-surface-container);
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
          font-size: 14px;
          color: var(--color-text);
        }

        .spot-desc {
          font-size: 12px;
          color: var(--color-text-muted);
          margin-top: 1px;
        }

        .spot-coords-tag {
          margin-top: 4px;
        }

        .custom-coords-toggle {
          border-top: 1px solid var(--color-surface-container-high);
          padding-top: 12px;
        }

        .toggle-link {
          background: none;
          border: none;
          color: var(--color-sea);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 4px 0;
        }

        .custom-coords-box {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background-color: var(--color-surface-container-low);
          padding: 14px;
          border-radius: 14px;
        }

        .coords-inputs-row {
          display: flex;
          gap: 10px;
        }

        .coord-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .coord-field label {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-muted);
        }

        .modal-footer-btns {
          margin-top: 8px;
        }
      `}</style>
    </Modal>
  )
}
