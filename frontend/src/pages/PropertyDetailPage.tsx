import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProperty } from '../hooks/useProperty'
import { useAuth } from '../contexts/AuthContext'
import { propertyApi } from '../lib/propertyApi'
import { formatArea, getListingTypeLabel, getPropertyStatusLabel } from '../utils/format'
import { StatusBadge } from '../components/StatusBadge'
import { PriceDisplay } from '../components/PriceDisplay'

export default function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: property, isLoading, error } = useProperty(propertyId || '')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false)

  const handleFavoriteToggle = async () => {
    if (!user || user.role !== 'client' || !property) return

    try {
      if (isFavorited) {
        await propertyApi.removeFavorite(property.id)
        setIsFavorited(false)
      } else {
        await propertyApi.addFavorite(property.id)
        setIsFavorited(true)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleContactAgent = () => {
    if (!user) {
      navigate('/login')
      return
    }
    setShowContactDialog(true)
  }

  const handleRequestViewing = () => {
    if (!user) {
      navigate('/login')
      return
    }
    setShowAppointmentDialog(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
          <p className="text-gray-600 mb-4">The property you're looking for doesn't exist or is not available.</p>
          <button
            onClick={() => navigate('/properties')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Properties
          </button>
        </div>
      </div>
    )
  }

  const primaryImage = property.images.find(img => img.is_primary) || property.images[0]
  const imageUrl = primaryImage?.image_url || '/placeholder-property.jpg'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <button onClick={() => navigate('/properties')} className="hover:text-blue-600">
            Properties
          </button>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{property.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={property.title}
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-property.jpg'
                  }}
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <StatusBadge status={property.status} type="property" />
                  {user?.role === 'client' && (
                    <button
                      onClick={handleFavoriteToggle}
                      className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {isFavorited ? (
                        <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {property.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {property.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === index ? 'border-blue-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt={`${property.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                  <p className="text-gray-600">{property.city && property.district ? `${property.district}, ${property.city}` : property.city || 'Location not specified'}</p>
                </div>
                <div className="text-right">
                  <PriceDisplay price={property.price} currency={property.currency} listingType={property.listing_type} showLabel />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{property.bedrooms}</div>
                  <div className="text-sm text-gray-600">Bedrooms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{property.bathrooms}</div>
                  <div className="text-sm text-gray-600">Bathrooms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatArea(property.area_sqm)}</div>
                  <div className="text-sm text-gray-600">Area (m²)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{property.rooms}</div>
                  <div className="text-sm text-gray-600">Rooms</div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed">{property.description || 'No description available.'}</p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Property Details</h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Reference Code</dt>
                    <dd className="text-gray-900">{property.reference_code}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                    <dd className="text-gray-900">{property.property_type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Listing Type</dt>
                    <dd className="text-gray-900">{getListingTypeLabel(property.listing_type)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-gray-900">{getPropertyStatusLabel(property.status)}</dd>
                  </div>
                  {property.construction_year && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Construction Year</dt>
                      <dd className="text-gray-900">{property.construction_year}</dd>
                    </div>
                  )}
                  {property.floor_number > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Floor</dt>
                      <dd className="text-gray-900">{property.floor_number} of {property.total_floors}</dd>
                    </div>
                  )}
                  {property.is_furnished && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Furnished</dt>
                      <dd className="text-gray-900">Yes</dd>
                    </div>
                  )}
                </dl>
              </div>

              {property.features.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Features</h2>
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feature) => (
                      <span
                        key={feature.id}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {feature.feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {property.address_line && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Address</h2>
                  <p className="text-gray-700">{property.address_line}</p>
                  {property.postal_code && <p className="text-gray-700">{property.postal_code}</p>}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleContactAgent}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Contact Agent
              </button>
              <button
                onClick={handleRequestViewing}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Request Viewing
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Agent Information</h2>
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">Agent Name</div>
                  <div className="text-sm text-gray-600">RE/MAX Smile</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+216 XX XXX XXX</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>agent@remax-smile.tn</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Agent Dialog */}
      {showContactDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Agent</h2>
            <p className="text-gray-600 mb-4">
              Send a message to the agent about this property.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="I'm interested in this property..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowContactDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowContactDialog(false)
                  // TODO: Implement actual message sending
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Request Dialog */}
      {showAppointmentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Viewing</h2>
            <p className="text-gray-600 mb-4">
              Schedule a viewing appointment for this property.
            </p>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Any specific requirements..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAppointmentDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAppointmentDialog(false)
                  // TODO: Implement actual appointment creation
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Request Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
