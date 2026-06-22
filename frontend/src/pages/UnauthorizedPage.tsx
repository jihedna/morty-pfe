import { Link } from 'react-router-dom'

export default function UnauthorizedPage() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1>403 - Unauthorized</h1>
      <p>You don't have permission to access this page.</p>
      <Link to="/">Go to Home</Link>
    </div>
  )
}
