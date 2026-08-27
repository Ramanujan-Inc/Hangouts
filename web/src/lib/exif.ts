import exifr from 'exifr'

export interface GpsPoint {
  latitude: number
  longitude: number
}

export interface BatchPhotoMetadata {
  date?: string // YYYY-MM-DD
  time?: string // HH:mm
  gpsPoints: GpsPoint[]
}

/**
 * Scans an array of files client-side and extracts:
 * 1. The first valid date and time.
 * 2. All valid GPS coordinates across the entire batch for spatial clustering.
 */
export async function extractBatchPhotoMetadata(files: File[]): Promise<BatchPhotoMetadata> {
  const result: BatchPhotoMetadata = {
    gpsPoints: [],
  }

  for (const file of files) {
    try {
      // 1. Extract Date and Time if not already found
      if (!result.date) {
        const data = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate', 'ModifyDate', 'DateTime'])
        if (data) {
          const rawDate = data.DateTimeOriginal || data.CreateDate || data.ModifyDate || data.DateTime
          if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
            const yyyy = rawDate.getFullYear()
            const mm = String(rawDate.getMonth() + 1).padStart(2, '0')
            const dd = String(rawDate.getDate()).padStart(2, '0')
            result.date = `${yyyy}-${mm}-${dd}`

            const hh = String(rawDate.getHours()).padStart(2, '0')
            const min = String(rawDate.getMinutes()).padStart(2, '0')
            if (hh !== '00' || min !== '00') {
              result.time = `${hh}:${min}`
            }
          } else if (typeof rawDate === 'string') {
            const match = rawDate.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})(?:[ T](\d{2}):(\d{2}))?/)
            if (match) {
              result.date = `${match[1]}-${match[2]}-${match[3]}`
              if (match[4] && match[5] && (match[4] !== '00' || match[5] !== '00')) {
                result.time = `${match[4]}:${match[5]}`
              }
            }
          }
        }
      }

      // 2. Extract GPS Coordinates for every photo
      const gps = await exifr.gps(file)
      if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
        if (!isNaN(gps.latitude) && !isNaN(gps.longitude) && (gps.latitude !== 0 || gps.longitude !== 0)) {
          result.gpsPoints.push({
            latitude: gps.latitude,
            longitude: gps.longitude,
          })
        }
      }
    } catch (err) {
      console.warn('Could not parse EXIF for file:', file.name, err)
    }
  }

  return result
}
