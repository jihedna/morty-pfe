import AppLayout from '../../components/layout/AppLayout'

export default function AdminUsers() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">User Administration</h1>

        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded" role="alert">
          <h2 className="font-semibold mb-2">Backend Capability Missing</h2>
          <p className="text-sm">
            User administration endpoints are not available in the backend. The backend currently only has demo endpoints in the users route.
            To enable user management, the backend needs to implement:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm space-y-1">
            <li>GET /api/v1/admin/users - List users with pagination and filters</li>
            <li>GET /api/v1/admin/users/{'{user_id}'} - Get user details</li>
            <li>POST /api/v1/admin/users - Create user</li>
            <li>PATCH /api/v1/admin/users/{'{user_id}'} - Update user</li>
            <li>PATCH /api/v1/admin/users/{'{user_id}'}/activate - Activate user</li>
            <li>PATCH /api/v1/admin/users/{'{user_id}'}/deactivate - Deactivate user</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            This page will be implemented once the backend provides user administration endpoints.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
