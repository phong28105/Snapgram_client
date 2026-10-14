"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

const images = [
  { src: "/auth-image-1.webp", alt: "Snapgram - Chia sẻ khoảnh khắc" },
  { src: "/auth-image-2.webp", alt: "Snapgram - Kết nối bạn bè" },
]

export default function AuthImageCarousel() {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % images.length)
        setFading(false)
      }, 600)
    }, 4000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full h-full select-none">
      {images.map((img, idx) => (
        <div
          key={img.src}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === current ? (fading ? "opacity-0" : "opacity-100") : "opacity-0"
          }`}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            className="object-cover"
            priority={idx === 0}
            sizes="(max-width: 768px) 0vw, 55vw"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20 pointer-events-none" />

      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
        <div className="flex gap-2 mb-4">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setFading(true)
                setTimeout(() => { setCurrent(idx); setFading(false) }, 300)
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === current ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Ảnh ${idx + 1}`}
            />
          ))}
        </div>
        <p className="text-sm font-medium text-white/80">
          Chia sẻ khoảnh khắc · Kết nối bạn bè · Khám phá thế giới
        </p>
      </div>
    </div>
  )
}
