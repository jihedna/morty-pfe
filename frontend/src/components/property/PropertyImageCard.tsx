import { PropertyImageResponse } from '../../lib/propertyImagesApi'

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
        <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 text-xs font-semibold rounded">
          Primary
        </div>
      )}
      <div className="p-3 space-y-2">
        <p className="text-sm text-gray-600 truncate">
          {image.alt_text || 'No description'}
        </p>
        <div className="flex gap-2">
          {!image.is_primary && (
            <button
              onClick={() => onSetPrimary(image.id)}
              className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            >
              Set Primary
            </button>
          )}
          <button
            onClick={() => onDelete(image.id)}
            className="flex-1 px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
