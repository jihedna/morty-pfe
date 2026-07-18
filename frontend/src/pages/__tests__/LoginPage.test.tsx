import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import LoginPage from '../LoginPage'

vi.mock('../../lib/authApi')
vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    setToken: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { authApi } from '../../lib/authApi'

function renderLogin() {
  localStorage.clear()
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockNavigate.mockReset()
  })

  it('renders email input', () => {
    renderLogin()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
  })

  it('renders password input', () => {
    renderLogin()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders Continue with Email button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /continue with email/i })).toBeInTheDocument()
  })

  it('Continue button is not disabled initially', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /continue with email/i })).not.toBeDisabled()
  })

  it('shows no giant decorative element', () => {
    const { container } = renderLogin()
    const huge = container.querySelector('[style*="100vw"], [style*="100vh"], [style*="border-radius: 50%"]')
    expect(huge).toBeNull()
  })

  it('shows no placeholder text like Coming Soon', () => {
    renderLogin()
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
  })

  it('shows Welcome back heading', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })

  it('Login tab is active on /login', () => {
    renderLogin()
    const loginTab = screen.getByRole('tab', { name: /login/i })
    expect(loginTab).toHaveAttribute('aria-selected', 'true')
  })

  it('Join tab links to /register', () => {
    renderLogin()
    const joinTab = screen.getByRole('tab', { name: /join/i })
    expect(joinTab).toHaveAttribute('href', '/register')
  })

  it('has no href="#" anchors', () => {
    const { container } = renderLogin()
    const hashLinks = container.querySelectorAll('a[href="#"]')
    expect(hashLinks).toHaveLength(0)
  })

  it('successful client login redirects to /client/dashboard', async () => {
    const clientUser = { id: '1', email: 'c@test.com', first_name: 'A', last_name: 'B', role: 'client' as const, is_active: true, created_at: '', updated_at: '' }
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'tok', token_type: 'bearer', user: clientUser })
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(clientUser)

    renderLogin()
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'c@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /continue with email/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/client/dashboard'))
  })

  it('successful agent login redirects to /agent/dashboard', async () => {
    const agentUser = { id: '2', email: 'a@test.com', first_name: 'X', last_name: 'Y', role: 'agent' as const, is_active: true, created_at: '', updated_at: '' }
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'tok', token_type: 'bearer', user: agentUser })
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(agentUser)

    renderLogin()
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /continue with email/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/agent/dashboard'))
  })

  it('successful manager login redirects to /admin/dashboard', async () => {
    const managerUser = { id: '3', email: 'm@test.com', first_name: 'M', last_name: 'N', role: 'manager' as const, is_active: true, created_at: '', updated_at: '' }
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'tok', token_type: 'bearer', user: managerUser })
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(managerUser)

    renderLogin()
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'm@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /continue with email/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard'))
  })

  it('failed login displays error message', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Incorrect email or password'))

    renderLogin()
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'bad@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /continue with email/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert')).toHaveTextContent(/incorrect email or password/i)
  })

  it('button is disabled while submitting', async () => {
    vi.mocked(authApi.login).mockReturnValue(new Promise(() => {}) as never)

    renderLogin()
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /continue with email/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled())
  })

  it('pressing Enter in password field submits the form', async () => {
    const clientUser = { id: '1', email: 'c@test.com', first_name: 'A', last_name: 'B', role: 'client' as const, is_active: true, created_at: '', updated_at: '' }
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'tok', token_type: 'bearer', user: clientUser })
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(clientUser)

    renderLogin()
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'c@test.com' } })
    const pwInput = screen.getByLabelText(/password/i)
    fireEvent.change(pwInput, { target: { value: 'pass' } })
    fireEvent.submit(pwInput.closest('form')!)

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/client/dashboard'))
  })
})
