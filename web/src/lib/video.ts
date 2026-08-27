/**
 * Generates a thumbnail JPEG Blob and Object URL from a video File using HTML5 Video + Canvas.
 * Seeks to seekTimeSeconds (default 0.5s) to avoid black opening frames.
 */
export async function generateVideoThumbnail(
  file: File,
  seekTimeSeconds = 0.5
): Promise<{ blob: Blob; url: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    const videoUrl = URL.createObjectURL(file)
    video.src = videoUrl

    let hasHandled = false

    const cleanup = () => {
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(videoUrl)
    }

    video.onloadedmetadata = () => {
      const targetTime =
        video.duration && video.duration > 0
          ? Math.min(seekTimeSeconds, Math.max(0.1, video.duration / 2))
          : seekTimeSeconds
      video.currentTime = targetTime
    }

    video.onseeked = () => {
      if (hasHandled) return
      hasHandled = true

      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 360

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          cleanup()
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            cleanup()
            if (blob) {
              const url = URL.createObjectURL(blob)
              resolve({ blob, url })
            } else {
              reject(new Error('Failed to create thumbnail blob from canvas'))
            }
          },
          'image/jpeg',
          0.85
        )
      } catch (err) {
        cleanup()
        reject(err)
      }
    }

    video.onerror = (err) => {
      if (hasHandled) return
      hasHandled = true
      cleanup()
      reject(err)
    }

    // Fallback timeout in case video loading fails or never seeks
    setTimeout(() => {
      if (!hasHandled) {
        hasHandled = true
        cleanup()
        reject(new Error('Video thumbnail extraction timed out'))
      }
    }, 5000)
  })
}
