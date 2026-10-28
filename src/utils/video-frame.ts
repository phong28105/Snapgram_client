/**
 * Trích xuất 1 khung hình (Keyframe) từ file video client-side bằng HTML5 Video và Canvas.
 * Tạo ra 1 File JPEG nhỏ gọn (~100-200KB) cực nhanh để gửi tới Vision AI model.
 */
export async function extractVideoKeyframe(videoFile: File, atTimeSeconds = 1.0): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    const url = URL.createObjectURL(videoFile)
    video.src = url
    video.muted = true
    video.playsInline = true
    video.crossOrigin = "anonymous"

    const cleanUp = () => {
      URL.revokeObjectURL(url)
      video.remove()
    }

    video.onloadedmetadata = () => {
      // Đảm bảo thời gian seek nằm trong độ dài của video
      const targetTime = Math.min(atTimeSeconds, Math.max(0.1, video.duration / 2))
      video.currentTime = targetTime
    }

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas")
        const width = video.videoWidth || 640
        const height = video.videoHeight || 360
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          cleanUp()
          reject(new Error("Không thể tạo canvas context 2D"))
          return
        }

        ctx.drawImage(video, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            cleanUp()
            if (blob) {
              const frameFile = new File([blob], "keyframe.jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
              resolve(frameFile)
            } else {
              reject(new Error("Không thể chuyển canvas thành blob ảnh"))
            }
          },
          "image/jpeg",
          0.85
        )
      } catch (err) {
        cleanUp()
        reject(err)
      }
    }

    video.onerror = () => {
      cleanUp()
      reject(new Error("Lỗi khi load video để trích xuất frame"))
    }
  })
}
