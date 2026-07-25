import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useProperty } from '../hooks/useProperty'
import { useAuth } from '../contexts/AuthContext'
import { useFavoriteStatus } from '../hooks/useFavoriteStatus'
import { propertyApi } from '../lib/propertyApi'
import { conversationsApi } from '../lib/conversationsApi'
import { appointmentsApi } from '../lib/appointmentsApi'
import { clientSearchRequestsApi } from '../lib/clientSearchRequestsApi'
import { extractApiError } from '../utils/format'
import { PropertyStatus } from '../types/property'
import PublicLayout from '../components/layout/PublicLayout'
import AppLayout from '../components/layout/AppLayout'
import PublicFooter from '../components/landing/PublicFooter'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import LoadingState from '../components/ui/LoadingState'
import ErrorAlert from '../components/ui/ErrorAlert'
import { PropertyBreadcrumbs } from '../components/property/PropertyBreadcrumbs'
import { PropertyGallery } from '../components/property/PropertyGallery'
import { PropertyHeader } from '../components/property/PropertyHeader'
import { PropertyStats } from '../components/property/PropertyStats'
import { PropertyDescription } from '../components/property/PropertyDescription'
import { PropertyFeatures } from '../components/property/PropertyFeatures'
import { PropertyLocationMap } from '../components/property/PropertyLocationMap'
import { SimilarPropertiesSection } from '../components/property/SimilarPropertiesSection'
import { PropertyContactCard } from '../components/property/PropertyContactCard'
import { ContactAgentDialog } from '../components/property/ContactAgentDialog'
import { AppointmentDialog } from '../components/property/AppointmentDialog'

export default function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const Layout = isAuthenticated && user?.role === 'client' ? AppLayout : PublicLayout
  const usesClientPortal = isAuthenticated && user?.role === 'client'
  const { data: property, isLoading, error } = useProperty(propertyId || '')
  const { isFavorited, isLoading: isFavoriteLoading, refetch: refetchFavoriteStatus } = useFavoriteStatus(propertyId || '')

  const [showContactDialog, setShowContactDialog] = useState(false)
  const [isContacting, setIsContacting] = useState(false)
  const [contactError, setContactError] = useState<string | null>(null)

  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false)
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false)
  const [appointmentError, setAppointmentError] = useState<string | null>(null)

  const [shareError, setShareError] = useState<string | null>(null)
  const [isAddingRequest, setIsAddingRequest] = useState(false)

  const handleFavoriteToggle = async () => {
    if (!user || user.role !== 'client' || !property) return

    try {
      if (isFavorited) {
        await propertyApi.removeFavorite(property.id)
      } else {
        await propertyApi.addFavorite(property.id)
      }
      refetchFavoriteStatus()
    } catch (err) {
      refetchFavoriteStatus()
    }
  }

  const handleShare = async () => {
    setShareError(null)
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: property?.title || 'Property', url })
        return
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        return
      }
    } catch (err) {
      setShareError('Unable to share this property.')
    }
  }

  const handleContactClick = () => {
    if (!user) {
      navigate('/login', { state: { redirectTo: location.pathname } })
      return
    }
    if (user.role !== 'client') return
    setShowContactDialog(true)
    setContactError(null)
  }

  const handleContactSubmit = async (message: string) => {
    if (!user || user.role !== 'client' || !property || isContacting) return

    setIsContacting(true)
    setContactError(null)

    try {
      const conversation = await conversationsApi.createConversation({
        subject: `Inquiry about ${property.title}`,
        property_id: property.id,
        agent_id: property.agent_id,
      })

      if (message) {
        await conversationsApi.createMessage(conversation.id, { content: message })
      }

      setShowContactDialog(false)
      navigate(`/client/conversations/${conversation.id}`)
    } catch (err) {
      setContactError(extractApiError(err) || 'Failed to contact agent. Please try again.')
    } finally {
      setIsContacting(false)
    }
  }

  const handleViewingClick = () => {
    if (!user) {
      navigate('/login', { state: { redirectTo: location.pathname } })
      return
    }
    if (user.role !== 'client') return
    if (property && (property.status === PropertyStatus.SOLD || property.status === PropertyStatus.RENTED || property.status === PropertyStatus.ARCHIVED)) {
      setAppointmentError('This property is not available for viewing.')
      return
    }
    setShowAppointmentDialog(true)
    setAppointmentError(null)
  }

  const handleAppointmentSubmit = async (start: string, end: string, notes: string) => {
    if (!user || user.role !== 'client' || !property || isSubmittingAppointment) return

    setIsSubmittingAppointment(true)
    setAppointmentError(null)

    try {
      await appointmentsApi.createAppointment({
        property_id: property.id,
        agent_id: property.agent_id,
        scheduled_start: start,
        scheduled_end: end,
        client_notes: notes || undefined,
      })

      setShowAppointmentDialog(false)
      navigate('/client/appointments')
    } catch (err) {
      const errorMessage = extractApiError(err)
      if (errorMessage?.toLowerCase().includes('conflict') || errorMessage?.toLowerCase().includes('unavailable')) {
        setAppointmentError('This time slot is unavailable. Please choose a different time.')
      } else {
        setAppointmentError(errorMessage || 'Failed to request appointment. Please try again.')
      }
    } finally {
      setIsSubmittingAppointment(false)
    }
  }

  const handleAddRequest = async () => {
    if (!user) {
      navigate('/login', { state: { redirectTo: location.pathname } })
      return
    }
    if (user.role !== 'client' || !property || isAddingRequest) return
    setIsAddingRequest(true)
    setShareError(null)
    try {
      await clientSearchRequestsApi.createFromProperty(property.id)
      navigate('/client/search-requests')
    } catch (err) {
      const message = extractApiError(err)
      if (message?.includes('already have an active request')) {
        navigate('/client/search-requests')
      } else {
        setShareError(message || 'Failed to add this property request.')
      }
    } finally {
      setIsAddingRequest(false)
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading property details…" />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <ErrorAlert message={error || 'Failed to load property'} className="mb-6" />
          <Button onClick={() => navigate('/properties')} type="button">
            Browse Properties
          </Button>
        </div>
      </Layout>
    )
  }

  if (!property) {
    return (
      <Layout>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <Card>
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-navy-900 mb-2">Property Not Found</h1>
              <p className="text-navy-600 mb-6">The property you're looking for doesn't exist or is not available.</p>
              <Button onClick={() => navigate('/properties')} type="button">
                Browse Properties
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <PropertyBreadcrumbs
          title={property.title}
          listingType={property.listing_type}
          city={property.city}
        />

        {shareError && (
          <ErrorAlert message={shareError} className="mb-4" />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <PropertyGallery images={property.images} title={property.title} />

            <PropertyHeader
              property={property}
              isFavorited={isFavorited}
              favoriteLoading={isFavoriteLoading}
              onFavoriteToggle={handleFavoriteToggle}
              onShare={handleShare}
            />

            <PropertyStats
              areaSqm={property.area_sqm}
              bedrooms={property.bedrooms}
              bathrooms={property.bathrooms}
              rooms={property.rooms}
            />

            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-navy-900">Description</h2>
              <PropertyDescription description={property.description} />
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-navy-900">Features</h2>
              <PropertyFeatures features={property.features} />
            </Card>

            {property.latitude && property.longitude && (
              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-navy-900">Location</h2>
                <PropertyLocationMap
                  latitude={property.latitude}
                  longitude={property.longitude}
                  title={property.title}
                />
              </Card>
            )}

            <SimilarPropertiesSection property={property} />
          </div>

          <aside className="lg:col-span-1">
            <PropertyContactCard
              property={property}
              user={user}
              isFavorited={isFavorited}
              isFavoriteLoading={isFavoriteLoading}
              onFavoriteToggle={handleFavoriteToggle}
              onShare={handleShare}
              onContactClick={handleContactClick}
              onViewingClick={handleViewingClick}
              onAddRequestClick={handleAddRequest}
              isAddingRequest={isAddingRequest}
            />
          </aside>
        </div>
      </div>

      {!usesClientPortal && <PublicFooter />}

      <ContactAgentDialog
        isOpen={showContactDialog}
        onClose={() => setShowContactDialog(false)}
        onSubmit={handleContactSubmit}
        isSubmitting={isContacting}
        error={contactError}
      />

      <AppointmentDialog
        isOpen={showAppointmentDialog}
        onClose={() => setShowAppointmentDialog(false)}
        onSubmit={handleAppointmentSubmit}
        isSubmitting={isSubmittingAppointment}
        error={appointmentError}
      />
    </Layout>
  )
}
