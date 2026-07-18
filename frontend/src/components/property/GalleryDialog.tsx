import { useEffect, useRef, useState } from 'react'
import { PropertyImage } from '../../types/property'
import Modal from '../ui/Modal'

interface GalleryDialogProps {
  images: PropertyImage[]
  title: string
  startIndex: number
  isOpen: boolean
  onClose: () => void
}

const PLACEHOLDER = '/placeholder-property.jpg'

export function GalleryDialog({ images, title, startIndex, isOpen, onClose }: GalleryDialogProps) {
  const [index, setIndex] = useState(startIndex)
  const [errorMap, setErrorMap] = useState<Record<string, boolean>>({})
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (isOpen) setIndex(startIndex)
  }, [isOpen, startIndex])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setIndex(i => (i === 0 ? images.length - 1 : i - 1))
      } else if (e.key === 'ArrowRight') {
        setIndex(i => (i === images.length - 1 ? 0 : i + 1))
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, images.length])

  const currentImage = images[index]
  if (!currentImage && isOpen) return null

  const handleImageError = (imageId: string) => {
    setErrorMap(prev => ({ ...prev, [imageId]: true }))
  }

  const getImageUrl = (image?: PropertyImage) => {
    if (!image) return PLACEHOLDER
    return errorMap[image.id] ? PLACEHOLDER : image.image_url
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gallery" size="lg">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full h-[60vh] max-h-[600px] rounded-2xl bg-surface-muted overflow-hidden">
          <img
            ref={imageRef}
            src={getImageUrl(currentImage)}
            alt={currentImage?.alt_text || `${title} - ${index + 1}`}
            className="w-full h-full object-contain"
            onError={() => currentImage && handleImageError(currentImage.id)}
            tabIndex={-1}
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIndex(i => (i === 0 ? images.length - 1 : i - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Previous image"
              >
                <svg className="w-5 h-5 text-navy-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setIndex(i => (i === images.length - 1 ? 0 : i + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Next image"
              >
                <svg className="w-5 h-5 text-navy-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
            {index + 1} / {images.length}
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto max-w-full px-1 pb-1">
            {images.map((image, i) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 ${
                  i === index ? 'border-primary-500' : 'border-transparent'
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === index ? 'true' : 'false'}
              >
                <img
                  src={getImageUrl(image)}
                  alt={image.alt_text || `${title} - ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(image.id)}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
