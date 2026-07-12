import { PropertyImageResponse } from '../../lib/propertyImagesApi'
import Button from '../ui/Button'

interface PropertyImageCardProps {
  image: PropertyImageResponse
  onSetPrimary: (imageId: string) => void
  onDelete: (imageId: string) => void
}

export default function PropertyImageCard({
  image,
  onSetPrimary,
  onDelete,
}: PropertyImageCardProps) {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available'
  }

  return (
    <div className="relative border rounded-lg overflow-hidden bg-white shadow">
      <img
        src={image.image_url}
        alt={image.alt_text || 'Property image'}
        onError={handleImageError}
        className="w-full h-48 object-cover"
        loading="lazy"
      />
      {image.is_primary && (
        <div className="absolute top-2 left-2 bg-primary-600 text-white px-2 py-1 text-xs font-semibold rounded">
          Primary
        </div>
      )}
      <div className="p-3 space-y-2">
        <p className="text-sm text-gray-600 truncate">
          {image.alt_text || 'No description'}
        </p>
        <div className="flex gap-2">
          {!image.is_primary && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => onSetPrimary(image.id)}
            >
              Set Primary
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(image.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
