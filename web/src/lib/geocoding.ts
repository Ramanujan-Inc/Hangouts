import {
  GpsPoint,
  LocationCluster,
  clusterGpsCoordinates,
  getCentroid,
  getClosestPoint,
  getDistanceMeters,
} from './geoMath'

export type { GpsPoint, LocationCluster }
export { clusterGpsCoordinates, getCentroid, getClosestPoint, getDistanceMeters }

export interface GeocodedLocation {
  locationName: string
  formattedAddress: string
  latitude: number
  longitude: number
  placeId?: string
}

export interface AddressHierarchy {
  poi?: string
  sublocality?: string // Barangay / District / Neighborhood
  locality?: string // Municipality / City
  adminArea2?: string // Province / County
  adminArea1?: string // Region / State
  country?: string
  formattedAddress: string
  placeId?: string
  latitude: number
  longitude: number
}

/**
 * Strips Google Plus Codes / Open Location Codes (e.g. "HVGV+8R", "8FVC+X9 ")
 * from address strings or place titles.
 */
export function stripPlusCodes(text: string): string {
  if (!text) return ''
  return text
    .replace(/\b[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}\b\s*,?\s*/gi, '')
    .replace(/^[,\s–—\-]+|[,\s–—\-]+$/g, '')
    .trim()
}

function hasPlusCode(text: string): boolean {
  return /[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}/i.test(text)
}

/**
 * Ensures that the full location address is displayed (without codes),
 * and guarantees that locationName and formattedAddress are consistent and deduplicated.
 */
export function ensureLocationIsSubstring(
  locationName: string,
  formattedAddress: string
): { locationName: string; formattedAddress: string } {
  const cleanName = stripPlusCodes(locationName)
  let cleanAddress = stripPlusCodes(formattedAddress)

  if (!cleanAddress) {
    return {
      locationName: cleanName || 'Selected Location',
      formattedAddress: cleanName || '',
    }
  }

  if (!cleanName) {
    const fallback = cleanAddress.split(',')[0].trim()
    return {
      locationName: fallback || 'Selected Location',
      formattedAddress: cleanAddress,
    }
  }

  const cleanNameLower = cleanName.toLowerCase()
  const cleanAddressLower = cleanAddress.toLowerCase()

  // 1. Direct case-insensitive substring match
  if (cleanAddressLower.includes(cleanNameLower)) {
    const idx = cleanAddressLower.indexOf(cleanNameLower)
    const exactName = cleanAddress.substring(idx, idx + cleanName.length).trim()
    return {
      locationName: exactName || cleanName,
      formattedAddress: cleanAddress,
    }
  }

  // 2. Segment-based check: if all parts of cleanName (e.g. "Taytay", "Rizal") exist in cleanAddress
  const nameParts = cleanName
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)

  const allPartsFound =
    nameParts.length > 0 &&
    nameParts.every((part) => cleanAddressLower.includes(part.toLowerCase()))

  if (allPartsFound) {
    return {
      locationName: cleanName,
      formattedAddress: cleanAddress,
    }
  }

  // 3. POI / Venue name not represented in the street-level address -> prepend it
  cleanAddress = `${cleanName}, ${cleanAddress}`
  return {
    locationName: cleanName,
    formattedAddress: cleanAddress,
  }
}

/**
 * Extracts a component from Google Maps address_components by type.
 */
function getComponent(components: any[] | undefined, ...types: string[]): string | undefined {
  if (!components || !Array.isArray(components)) return undefined
  for (const type of types) {
    const found = components.find((c: any) => c.types?.includes(type))
    if (found?.long_name && !hasPlusCode(found.long_name)) {
      return found.long_name.trim()
    }
  }
  return undefined
}

/**
 * OpenStreetMap Nominatim fallback for reverse geocoding when Google Maps is unavailable.
 */
async function fetchOsmHierarchy(lat: number, lng: number): Promise<AddressHierarchy | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } }
    )
    if (res.ok) {
      const data = await res.json()
      const addr = data.address || {}
      const poi =
        data.name ||
        addr.amenity ||
        addr.building ||
        addr.tourism ||
        addr.historic ||
        addr.shop ||
        addr.leisure ||
        undefined

      const sublocality =
        addr.suburb || addr.neighbourhood || addr.quarter || addr.village || addr.subdistrict
      const locality = addr.city || addr.town || addr.municipality || addr.city_district
      const adminArea2 = addr.county || addr.province || addr.state_district
      const adminArea1 = addr.state || addr.region
      const country = addr.country

      const rawAddress = data.display_name || ''
      const formattedAddress = stripPlusCodes(rawAddress) || `${lat.toFixed(6)}, ${lng.toFixed(6)}`

      return {
        poi: poi ? stripPlusCodes(poi) : undefined,
        sublocality: sublocality ? stripPlusCodes(sublocality) : undefined,
        locality: locality ? stripPlusCodes(locality) : undefined,
        adminArea2: adminArea2 ? stripPlusCodes(adminArea2) : undefined,
        adminArea1: adminArea1 ? stripPlusCodes(adminArea1) : undefined,
        country: country ? stripPlusCodes(country) : undefined,
        formattedAddress,
        latitude: lat,
        longitude: lng,
      }
    }
  } catch (osmErr) {
    console.warn('OSM reverse geocode fallback warning:', osmErr)
  }
  return null
}

/**
 * Retrieves the full geographic address hierarchy for a single coordinate using Google Maps Geocoder,
 * with automatic fallback to OpenStreetMap Nominatim.
 */
export async function getGeocodedHierarchy(lat: number, lng: number): Promise<AddressHierarchy | null> {
  // 1. Google Maps Geocoder API
  if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
    try {
      const geocoder = new (window as any).google.maps.Geocoder()
      const geoRes = await geocoder.geocode({ location: { lat, lng } })

      if (geoRes.results && geoRes.results.length > 0) {
        const nonPlusResults = geoRes.results.filter((r: any) => !r.types?.includes('plus_code'))
        const primaryResult = nonPlusResults[0] || geoRes.results[0]
        const placeId = primaryResult.place_id || undefined

        const rawAddress = primaryResult.formatted_address || geoRes.results[0].formatted_address || ''
        const formattedAddress = stripPlusCodes(rawAddress)

        // Find specific POI across all results
        let poi: string | undefined = undefined
        for (const res of geoRes.results) {
          const poiName = getComponent(
            res.address_components,
            'point_of_interest',
            'establishment',
            'tourist_attraction',
            'natural_feature',
            'park',
            'premise'
          )
          if (poiName && !hasPlusCode(poiName)) {
            poi = poiName
            break
          }
        }

        const comps = primaryResult.address_components || geoRes.results[0]?.address_components
        const sublocality = getComponent(comps, 'sublocality', 'sublocality_level_1', 'neighborhood')
        const locality = getComponent(comps, 'locality', 'postal_town', 'administrative_area_level_3')
        const adminArea2 = getComponent(comps, 'administrative_area_level_2')
        const adminArea1 = getComponent(comps, 'administrative_area_level_1')
        const country = getComponent(comps, 'country')

        return {
          poi,
          sublocality,
          locality,
          adminArea2,
          adminArea1,
          country,
          formattedAddress: formattedAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          placeId,
          latitude: lat,
          longitude: lng,
        }
      }
    } catch (err) {
      console.warn('Geocoding hierarchy error:', err)
    }
  }

  // 2. OpenStreetMap Nominatim Fallback
  const osmResult = await fetchOsmHierarchy(lat, lng)
  if (osmResult) {
    return osmResult
  }

  return {
    formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    latitude: lat,
    longitude: lng,
  }
}

/**
 * Builds the candidate venue/location name for a single location hierarchy:
 * - POI (if present): "Casa Rica" or "Patapat Viaduct"
 * - Sublocality + Locality + Province: "Crisologo, Vigan City, Ilocos Sur"
 * - Locality + Province: "Taytay, Rizal"
 */
export function buildSingleLocationName(h: AddressHierarchy): string {
  if (h.poi) return h.poi

  if (h.sublocality && h.locality && h.adminArea2) {
    return `${h.sublocality}, ${h.locality}, ${h.adminArea2}`
  }
  if (h.sublocality && h.locality && h.sublocality.toLowerCase() !== h.locality.toLowerCase()) {
    return `${h.sublocality}, ${h.locality}`
  }
  if (h.locality && (h.adminArea2 || h.adminArea1)) {
    const parentArea = h.adminArea2 || h.adminArea1
    return h.locality.toLowerCase() !== parentArea?.toLowerCase() ? `${h.locality}, ${parentArea}` : h.locality
  }
  if (h.locality) return h.locality
  if (h.sublocality) return h.sublocality
  if (h.formattedAddress) return h.formattedAddress.split(',')[0].trim()
  return `Pinned Spot (${h.latitude.toFixed(4)}, ${h.longitude.toFixed(4)})`
}

/**
 * Finds the common shared geographic location among multiple hierarchies (lowest common ancestor):
 * - Shared Locality: "Taytay, Rizal"
 * - Shared Province: "Ilocos Norte"
 * - Fallback: City/Province of the anchor cluster
 */
export function findSharedLocation(hierarchies: AddressHierarchy[], anchorPoint: GpsPoint): GeocodedLocation {
  const first = hierarchies[0]
  let sharedCandidate = ''

  if (hierarchies.length === 1) {
    sharedCandidate = buildSingleLocationName(first)
  } else {
    const firstLocality = first.locality?.toLowerCase()
    const sameLocality = firstLocality && hierarchies.every((h) => h.locality?.toLowerCase() === firstLocality)

    if (sameLocality) {
      const firstSub = first.sublocality?.toLowerCase()
      const sameSub = firstSub && hierarchies.every((h) => h.sublocality?.toLowerCase() === firstSub)
      const parent = first.adminArea2 || first.adminArea1

      if (sameSub && first.sublocality) {
        sharedCandidate = first.locality ? `${first.sublocality}, ${first.locality}${parent ? `, ${parent}` : ''}` : first.sublocality
      } else {
        sharedCandidate =
          first.locality && parent && first.locality.toLowerCase() !== parent.toLowerCase()
            ? `${first.locality}, ${parent}`
            : first.locality || parent || ''
      }
    } else {
      const firstAdmin2 = first.adminArea2?.toLowerCase()
      const sameAdmin2 = firstAdmin2 && hierarchies.every((h) => h.adminArea2?.toLowerCase() === firstAdmin2)

      if (sameAdmin2 && first.adminArea2) {
        sharedCandidate = first.adminArea2
      } else {
        sharedCandidate =
          first.locality && first.adminArea2
            ? `${first.locality}, ${first.adminArea2}`
            : first.locality || first.adminArea2 || ''
      }
    }
  }

  const candidate = sharedCandidate || first.formattedAddress.split(',')[0].trim() || 'Selected Location'
  const { locationName, formattedAddress } = ensureLocationIsSubstring(candidate, first.formattedAddress)

  return {
    locationName,
    formattedAddress,
    latitude: anchorPoint.latitude,
    longitude: anchorPoint.longitude,
    placeId: first.placeId,
  }
}

/**
 * Reverse geocodes coordinates (lat, lng) to venue name and formatted address.
 */
export async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<GeocodedLocation> {
  const hierarchy = await getGeocodedHierarchy(lat, lng)
  if (!hierarchy) {
    return {
      locationName: `Pinned Spot (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      latitude: lat,
      longitude: lng,
    }
  }

  const candidate = buildSingleLocationName(hierarchy)
  const { locationName, formattedAddress } = ensureLocationIsSubstring(candidate, hierarchy.formattedAddress)

  return {
    locationName,
    formattedAddress,
    latitude: lat,
    longitude: lng,
    placeId: hierarchy.placeId,
  }
}

/**
 * Resolves the optimal location from a batch of GPS coordinates using Mode & Hierarchy:
 * - Case 1 (Strict majority > 50% in one cluster): Uses representative coordinates of that cluster.
 * - Case 2 (Spread across multiple areas / No single majority or tied): Determines the common shared geographic location.
 */
export async function resolveBatchLocation(gpsPoints: GpsPoint[]): Promise<GeocodedLocation | null> {
  if (!gpsPoints || gpsPoints.length === 0) return null

  const firstPhotoPoint = gpsPoints[0]
  if (gpsPoints.length === 1) {
    return reverseGeocodeCoordinates(firstPhotoPoint.latitude, firstPhotoPoint.longitude)
  }

  const clusters = clusterGpsCoordinates(gpsPoints, 300)
  const dominantCluster = clusters[0]
  const secondCluster = clusters[1]

  const isStrictMajority =
    dominantCluster &&
    dominantCluster.count > gpsPoints.length * 0.5 &&
    (!secondCluster || dominantCluster.count > secondCluster.count)

  if (isStrictMajority) {
    return reverseGeocodeCoordinates(
      dominantCluster.representativePoint.latitude,
      dominantCluster.representativePoint.longitude
    )
  }

  const distinctClusters = clusters.slice(0, 4)
  const hierarchies: AddressHierarchy[] = []

  for (const cluster of distinctClusters) {
    const h = await getGeocodedHierarchy(
      cluster.representativePoint.latitude,
      cluster.representativePoint.longitude
    )
    if (h) {
      hierarchies.push(h)
    }
  }

  const anchorPoint = dominantCluster?.representativePoint || firstPhotoPoint

  if (hierarchies.length === 0) {
    return reverseGeocodeCoordinates(anchorPoint.latitude, anchorPoint.longitude)
  }

  return findSharedLocation(hierarchies, anchorPoint)
}
