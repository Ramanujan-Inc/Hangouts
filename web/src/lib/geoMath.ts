export interface GpsPoint {
  latitude: number
  longitude: number
}

export interface LocationCluster {
  representativePoint: GpsPoint
  centroid: GpsPoint
  firstPoint: GpsPoint
  count: number
  points: GpsPoint[]
}

/**
 * Calculates great-circle distance between two coordinates in meters (Haversine formula).
 */
export function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculates the geographic centroid (arithmetic mean of lat/lng) for a set of points.
 */
export function getCentroid(points: GpsPoint[]): GpsPoint {
  if (points.length === 0) return { latitude: 0, longitude: 0 }
  const sumLat = points.reduce((sum, p) => sum + p.latitude, 0)
  const sumLng = points.reduce((sum, p) => sum + p.longitude, 0)
  return {
    latitude: sumLat / points.length,
    longitude: sumLng / points.length,
  }
}

/**
 * Finds the actual GPS point within an array that is closest to the given target coordinate.
 */
export function getClosestPoint(points: GpsPoint[], target: GpsPoint): GpsPoint {
  let closest = points[0]
  let minDistance = Infinity

  for (const point of points) {
    const dist = getDistanceMeters(point.latitude, point.longitude, target.latitude, target.longitude)
    if (dist < minDistance) {
      minDistance = dist
      closest = point
    }
  }

  return closest
}

/**
 * Clusters an array of GPS coordinates into distinct venues/spots using a 300m walking/venue radius.
 * Computes the cluster centroid and selects the actual photo coordinate closest to the centroid as the representative point.
 */
export function clusterGpsCoordinates(points: GpsPoint[], radiusMeters: number = 300): LocationCluster[] {
  const rawClusters: {
    firstPoint: GpsPoint
    points: GpsPoint[]
  }[] = []

  for (const point of points) {
    let matchedCluster: { firstPoint: GpsPoint; points: GpsPoint[] } | null = null

    for (const cluster of rawClusters) {
      const currentCentroid = getCentroid(cluster.points)
      const dist = getDistanceMeters(
        point.latitude,
        point.longitude,
        currentCentroid.latitude,
        currentCentroid.longitude
      )
      if (dist <= radiusMeters) {
        matchedCluster = cluster
        break
      }
    }

    if (matchedCluster) {
      matchedCluster.points.push(point)
    } else {
      rawClusters.push({
        firstPoint: point,
        points: [point],
      })
    }
  }

  // Compute centroid and find the point closest to the centroid for each cluster
  const clusters: LocationCluster[] = rawClusters.map((c) => {
    const centroid = getCentroid(c.points)
    const representativePoint = getClosestPoint(c.points, centroid)
    return {
      firstPoint: c.firstPoint,
      centroid,
      representativePoint,
      count: c.points.length,
      points: c.points,
    }
  })

  return clusters.sort((a, b) => b.count - a.count)
}
