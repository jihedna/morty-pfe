import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import RegisterPage from '../RegisterPage'

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

function renderRegister() {
  localStorage.clear()
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockNavigate.mockReset()
  })

  it('renders first name input', () => {
    renderRegister()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
  })

  it('renders last name input', () => {
    renderRegister()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
  })

  it('renders email input', () => {
    renderRegister()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
  })

  it('renders password input', () => {
    renderRegister()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
  })

  it('renders confirm password input', () => {
    renderRegister()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('renders Create Account button', () => {
    renderRegister()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('Create Account button is not disabled initially', () => {
    renderRegister()
    expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled()
  })

  it('shows Create Account heading', () => {
    renderRegister()
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
  })

  it('Join tab is active on /register', () => {
    renderRegister()
    const joinTab = screen.getByRole('tab', { name: /join/i })
    expect(joinTab).toHaveAttribute('aria-selected', 'true')
  })

  it('Login tab links to /login', () => {
    renderRegister()
    const loginTab = screen.getByRole('tab', { name: /login/i })
    expect(loginTab).toHaveAttribute('href', '/login')
  })

  it('has no href="#" anchors', () => {
    const { container } = renderRegister()
    const hashLinks = container.querySelectorAll('a[href="#"]')
    expect(hashLinks).toHaveLength(0)
  })

  it('shows error for mismatched passwords', async () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@test.com' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'ValidPass1' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'DifferentPass1' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert')).toHaveTextContent(/passwords do not match/i)
  })

  it('shows error for weak password', async () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@test.com' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'weak' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'weak' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters/i)
  })

  it('successful registration redirects to /client/dashboard', async () => {
    const clientUser = { id: '1', email: 'john@test.com', first_name: 'John', last_name: 'Doe', role: 'client' as const, is_active: true, created_at: '', updated_at: '' }
    vi.mocked(authApi.register).mockResolvedValue({ access_token: 'tok', token_type: 'bearer', user: clientUser })
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(clientUser)

    renderRegister()
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@test.com' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'ValidPass1' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'ValidPass1' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/client/dashboard'))
  })

  it('failed registration displays error message', async () => {
    vi.mocked(authApi.register).mockRejectedValue(new Error('Email already registered'))

    renderRegister()
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'dup@test.com' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'ValidPass1' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'ValidPass1' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert')).toHaveTextContent(/email already registered/i)
  })

  it('button is disabled while submitting', async () => {
    vi.mocked(authApi.register).mockReturnValue(new Promise(() => {}) as never)

    renderRegister()
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@test.com' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'ValidPass1' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'ValidPass1' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled())
  })
})
