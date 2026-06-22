// User administration endpoints are not available in the backend
// The backend only has demo endpoints in users.py
// This file serves as a placeholder to indicate missing backend capability

export interface UserResponse {
  id: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

export const adminUsersApi = {
  // Placeholder - backend does not have user administration endpoints
  // When backend adds user management, implement:
  // listUsers, getUser, createUser, updateUser, deactivateUser, etc.
}
