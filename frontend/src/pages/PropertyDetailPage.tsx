import { useParams } from 'react-router-dom'

export default function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>()

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Property Details</h1>
      <p>Property ID: {propertyId}</p>
      <p>Property details page (Coming Soon)</p>
    </div>
  )
}
