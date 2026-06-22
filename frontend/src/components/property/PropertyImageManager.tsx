import { useState } from 'react'
import { propertyImagesApi, PropertyImageResponse, PropertyImageCreate } from '../../lib/propertyImagesApi'
import { extractApiError } from '../../utils/format'
import ConfirmDialog from '../common/ConfirmDialog'
import PropertyImageCard from './PropertyImageCard'

interface PropertyImageManagerProps {
  propertyId: string
  images: PropertyImageResponse[]
  onImagesChange: () => void
}

export default function PropertyImageManager({
  propertyId,
  images,
  onImagesChange,
}: PropertyImageManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newAltText, setNewAltText] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    imageId: string
  }>({ isOpen: false, imageId: '' })

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newImageUrl.trim()) {
      setError('Image URL is required')
      return
    }

    setIsAdding(true)
    setError(null)

    try {
      const imageData: PropertyImageCreate = {
        image_url: newImageUrl.trim(),
        alt_text: newAltText.trim() || undefined,
        position: images.length,
        is_primary: images.length === 0,
      }
      await propertyImagesApi.addPropertyImage(propertyId, imageData)
      setNewImageUrl('')
      setNewAltText('')
      onImagesChange()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to add image')
    } finally {
      setIsAdding(false)
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    try {
      await propertyImagesApi.setPrimaryImage(propertyId, imageId)
      onImagesChange()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to set primary image')
    }
  }

  const handleDeleteClick = (imageId: string) => {
    setDeleteDialog({ isOpen: true, imageId })
  }

  const handleDeleteConfirm = async () => {
    try {
      await propertyImagesApi.deletePropertyImage(propertyId, deleteDialog.imageId)
      setDeleteDialog({ isOpen: false, imageId: '' })
      onImagesChange()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to delete image')
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, imageId: '' })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Property Images</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
          {error}
        </div>
      )}

      {/* Add Image Form */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h4 className="font-medium">Add New Image</h4>
        <form onSubmit={handleAddImage} className="space-y-4">
          <div>
            <label htmlFor="image-url" className="block text-sm font-medium text-gray-700 mb-1">
              Image URL *
            </label>
            <input
              type="url"
              id="image-url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <label htmlFor="alt-text" className="block text-sm font-medium text-gray-700 mb-1">
              Alt Text
            </label>
            <input
              type="text"
              id="alt-text"
              value={newAltText}
              onChange={(e) => setNewAltText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description of the image for accessibility"
            />
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isAdding ? 'Adding...' : 'Add Image'}
          </button>
        </form>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <PropertyImageCard
            key={image.id}
            image={image}
            onSetPrimary={handleSetPrimary}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No images added yet
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDestructive
      />
    </div>
  )
}
