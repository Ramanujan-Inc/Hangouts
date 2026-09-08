import { api } from './api'
import { HangoutMedia } from '../components/hangout/types'

export interface UploadMediaItem {
  file: File
  caption?: string
  isCover?: boolean
}

interface DirectUploadItemResponse {
  upload_url: string
  object_key: string
  filename: string
  content_type: string
  file_size_bytes: number
}

interface DirectUploadResponse {
  items: DirectUploadItemResponse[]
}

/**
 * Upload media files to a hangout gallery.
 *
 * Tries direct client-to-storage (Cloudflare R2) upload first to bypass
 * Render RAM/CPU limits. If direct upload fails for any reason (such as R2 CORS
 * or network failure), transparently falls back to multipart /media/bulk upload.
 */
export async function uploadMediaItems(
  hangoutId: string,
  items: UploadMediaItem[],
  isShared: boolean = true
): Promise<HangoutMedia[]> {
  if (!items || items.length === 0) return []

  try {
    // 1. Request presigned PUT upload URLs from backend
    const preparePayload = {
      files: items.map((item) => ({
        filename: item.file.name,
        content_type: item.file.type || 'application/octet-stream',
        file_size_bytes: item.file.size,
      })),
    }

    const presignedData = await api.post<DirectUploadResponse>(
      `/hangouts/${hangoutId}/media/upload-urls`,
      preparePayload
    )

    if (presignedData?.items && presignedData.items.length === items.length) {
      // 2. Upload each file directly to Cloudflare R2 via presigned PUT
      await Promise.all(
        items.map(async (item, index) => {
          const target = presignedData.items[index]
          const contentType = target.content_type || item.file.type || 'application/octet-stream'

          const putRes = await fetch(target.upload_url, {
            method: 'PUT',
            body: item.file,
            headers: {
              'Content-Type': contentType,
            },
          })

          if (!putRes.ok) {
            throw new Error(
              `Direct R2 storage upload failed for '${item.file.name}' with status ${putRes.status}`
            )
          }
        })
      )

      // 3. Confirm uploads with backend to record in database
      const confirmPayload = {
        items: items.map((item, index) => ({
          object_key: presignedData.items[index].object_key,
          file_size_bytes: item.file.size,
          content_type: presignedData.items[index].content_type || item.file.type || 'application/octet-stream',
          caption: item.caption || null,
          is_shared: isShared,
          is_cover: Boolean(item.isCover),
        })),
      }

      const confirmedItems = await api.post<HangoutMedia[]>(
        `/hangouts/${hangoutId}/media/confirm`,
        confirmPayload
      )

      return Array.isArray(confirmedItems) ? confirmedItems : [confirmedItems]
    }
  } catch (directErr) {
    console.warn(
      'Direct storage upload failed; falling back to multipart /media/bulk upload:',
      directErr
    )
  }

  // Fallback: Upload through backend multipart endpoint
  const formData = new FormData()
  items.forEach((item) => {
    formData.append('files', item.file)
  })
  const captionsList = items.map((item) => item.caption || '')
  formData.append('captions_json', JSON.stringify(captionsList))
  formData.append('is_shared', String(isShared))

  const coverIndex = items.findIndex((item) => item.isCover)
  if (coverIndex >= 0) {
    formData.append('cover_index', String(coverIndex))
  }

  const fallbackItems = await api.upload<HangoutMedia[]>(
    `/hangouts/${hangoutId}/media/bulk`,
    formData
  )
  return Array.isArray(fallbackItems) ? fallbackItems : [fallbackItems]
}

interface CoverUploadResponse {
  upload_url: string
  public_url: string
}

/**
 * Upload a hangout cover photo.
 *
 * Tries direct client-to-storage (Cloudflare R2 public bucket) upload first
 * to avoid streaming large image bytes through Render.
 * Transparently falls back to multipart POST /hangouts/cover if direct upload fails.
 */
export async function uploadCoverPhoto(
  file: File | Blob,
  filename?: string
): Promise<string> {
  const actualFilename = filename || (file instanceof File ? file.name : 'cover-thumbnail.jpg')
  const contentType = file.type || 'image/jpeg'

  try {
    // 1. Request presigned PUT URL from backend
    const presigned = await api.post<CoverUploadResponse>('/hangouts/cover/upload-url', {
      filename: actualFilename,
      content_type: contentType,
    })

    if (presigned?.upload_url && presigned?.public_url) {
      // 2. Direct PUT stream from browser to Cloudflare R2
      const putRes = await fetch(presigned.upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType,
        },
      })

      if (putRes.ok) {
        return presigned.public_url
      }
      console.warn(
        `Direct cover storage upload failed with status ${putRes.status}; falling back to multipart`
      )
    }
  } catch (directErr) {
    console.warn(
      'Direct cover upload failed; falling back to multipart /hangouts/cover:',
      directErr
    )
  }

  // Fallback: Multipart upload through Render backend
  const coverForm = new FormData()
  coverForm.append('file', file, actualFilename)
  const coverRes = await api.post<{ url: string }>('/hangouts/cover', coverForm)
  return coverRes.url
}
