import { useState } from 'react'
import { Card, SectionHeader } from '../ui/shared'
import Input from '../ui/Input'
import Button from '../ui/Button'
import FormFieldError from '../common/FormFieldError'
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
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; imageId: string }>({
    isOpen: false,
    imageId: '',
  })

  const handleAddImage = async () => {
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
      setError(extractApiError(err) || 'Failed to add image')
    } finally {
      setIsAdding(false)
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    try {
      await propertyImagesApi.setPrimaryImage(propertyId, imageId)
      onImagesChange()
    } catch (err) {
      setError(extractApiError(err) || 'Failed to set primary image')
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
      setError(extractApiError(err) || 'Failed to delete image')
    } finally {
      setDeleteDialog({ isOpen: false, imageId: '' })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, imageId: '' })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddImage()
    }
  }

  return (
    <Card>
      <SectionHeader title="Property Images" />
      <FormFieldError message={error} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="image-url"
            type="url"
            label="Image URL"
            value={newImageUrl}
            onChange={setNewImageUrl}
            onKeyDown={handleKeyDown}
            required
            placeholder="https://example.com/image.jpg"
          />
          <Input
            id="alt-text"
            label="Alt Text"
            value={newAltText}
            onChange={setNewAltText}
            onKeyDown={handleKeyDown}
            placeholder="Description of the image for accessibility"
          />
        </div>
        <Button
          type="button"
          onClick={handleAddImage}
          isLoading={isAdding}
          disabled={isAdding || !newImageUrl.trim()}
        >
          Add Image
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
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
        <div className="text-center py-8 text-gray-500">No images added yet</div>
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
    </Card>
  )
}
