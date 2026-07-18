import { useMemo, useState } from 'react'
import { PropertyImage } from '../../types/property'
import { GalleryDialog } from './GalleryDialog'

interface PropertyGalleryProps {
  images: PropertyImage[]
  title: string
}

const PLACEHOLDER = '/placeholder-property.jpg'

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const displayImages = useMemo(() => {
    if (images.length === 0) return []
    return [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }, [images])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [errorMap, setErrorMap] = useState<Record<string, boolean>>({})
  const [dialogOpen, setDialogOpen] = useState(false)

  const currentImage = displayImages[selectedIndex]

  const sideImages = useMemo(() => {
    if (displayImages.length === 0) return []
    return displayImages
      .map((img, i) => ({ ...img, originalIndex: i }))
      .filter((_, i) => i !== selectedIndex)
      .slice(0, 3)
  }, [displayImages, selectedIndex])

  const remainingCount = displayImages.length > 4 ? displayImages.length - 4 : 0

  const handleImageError = (imageId: string) => {
    setErrorMap(prev => ({ ...prev, [imageId]: true }))
  }

  const getImageUrl = (image?: PropertyImage) => {
    if (!image) return PLACEHOLDER
    return errorMap[image.id] ? PLACEHOLDER : image.image_url
  }

  if (displayImages.length === 0) {
    return (
      <div className="w-full h-80 md:h-[520px] rounded-2xl bg-surface-muted border border-slate-200 flex items-center justify-center overflow-hidden">
        <img
          src={PLACEHOLDER}
          alt={title}
          className="w-full h-full object-cover"
          onError={e => { e.currentTarget.src = PLACEHOLDER }}
        />
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-3 gap-3 md:gap-4 h-auto">
        {/* Main image */}
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="row-span-1 md:row-span-3 h-72 md:h-auto relative rounded-2xl overflow-hidden bg-surface-muted group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          aria-label={`View full gallery for ${title}`}
        >
          <img
            src={getImageUrl(currentImage)}
            alt={currentImage?.alt_text || title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => currentImage && handleImageError(currentImage.id)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        </button>

        {/* Side thumbnails */}
        {sideImages.map((image, idx) => {
          const isLast = idx === sideImages.length - 1
          const showOverlay = isLast && remainingCount > 0
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedIndex(image.originalIndex)}
              className="h-28 md:h-auto relative rounded-2xl overflow-hidden bg-surface-muted group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              aria-label={`View image ${image.originalIndex + 1} of ${displayImages.length}`}
            >
              <img
                src={getImageUrl(image)}
                alt={image.alt_text || `${title} - ${image.originalIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => handleImageError(image.id)}
              />
              {showOverlay && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-lg">
                  +{remainingCount}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <GalleryDialog
        images={displayImages}
        title={title}
        startIndex={selectedIndex}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  )
}
