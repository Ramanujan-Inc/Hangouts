import { api } from './api'
import { HangoutMedia } from '../components/hangout/types'

export interface UploadMediaItem {
  file: File
  caption?: string
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

  const fallbackItems = await api.upload<HangoutMedia[]>(
    `/hangouts/${hangoutId}/media/bulk`,
    formData
  )
  return Array.isArray(fallbackItems) ? fallbackItems : [fallbackItems]
}
