import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { adminUsersApi, UserResponse } from '../../lib/adminUsersApi'
import { extractApiError } from '../../utils/format'
import { DataTable, FilterPanel, PageHeader, LoadingState } from '../../components/ui/shared'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/StatusBadge'

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'client', label: 'Client' },
  { value: 'agent', label: 'Agent' },
  { value: 'manager', label: 'Manager' },
]

const ACTIVE_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

function roleBadge(role: string) {
  const classes =
    role === 'manager'
      ? 'bg-accent-100 text-accent-700 border-accent-200'
      : role === 'agent'
      ? 'bg-primary-100 text-primary-700 border-primary-200'
      : 'bg-success-100 text-success-700 border-success-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${classes}`}>
      {role}
    </span>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [roleFilter, setRoleFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const limit = 20

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const activeValue = activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined
      const data = await adminUsersApi.listUsers({
        skip: page * limit,
        limit,
        role: roleFilter || undefined,
        is_active: activeValue,
        search: searchQuery || undefined,
      })
      setUsers(data.users)
      setTotal(data.total)
    } catch (err) {
      setError(extractApiError(err) || 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [page, roleFilter, activeFilter, searchQuery])

  useEffect(() => { load() }, [load])

  const handleToggleActive = async (user: UserResponse) => {
    setActionLoading(user.id)
    try {
      const updated = user.is_active
        ? await adminUsersApi.deactivateUser(user.id)
        : await adminUsersApi.activateUser(user.id)
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
    } catch (err) {
      setError(extractApiError(err) || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = Math.ceil(total / limit)

  const tableColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (user: UserResponse) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary-700">
              {user.first_name[0]}{user.last_name[0]}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</span>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (user: UserResponse) => <span className="text-sm text-gray-600">{user.email}</span> },
    { key: 'role', header: 'Role', render: (user: UserResponse) => roleBadge(user.role) },
    { key: 'status', header: 'Status', render: (user: UserResponse) => (
      <StatusBadge status={user.is_active ? 'Active' : 'Inactive'} type="default" />
    )},
    { key: 'joined', header: 'Joined', render: (user: UserResponse) => <span className="text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</span> },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (user: UserResponse) => (
        <Button
          type="button"
          variant={user.is_active ? 'danger' : 'primary'}
          size="sm"
          onClick={() => handleToggleActive(user)}
          isLoading={actionLoading === user.id}
        >
          {user.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ]

  if (isLoading && users.length === 0) {
    return (
      <AppLayout>
        <LoadingState message='Loading users…' />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title='User Management'
          subtitle={`${total} total users`}
          action={
            <Button type='button' onClick={() => load()} size='sm'>
              Refresh
            </Button>
          }
        />

        {error && (
          <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-2xl" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <FilterPanel
          title='Filters'
          hasFilters={!!roleFilter || !!activeFilter || !!searchQuery}
          onClear={() => { setRoleFilter(''); setActiveFilter(''); setSearchQuery(''); setPage(0) }}
        >
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 items-end'>
            <Select
              id='role-filter'
              value={roleFilter}
              onChange={v => { setRoleFilter(v); setPage(0) }}
              label='Role'
              options={ROLE_OPTIONS}
            />
            <Select
              id='active-filter'
              value={activeFilter}
              onChange={v => { setActiveFilter(v); setPage(0) }}
              label='Status'
              options={ACTIVE_OPTIONS}
            />
            <Input
              id='search-users'
              label='Search'
              value={searchQuery}
              onChange={v => { setSearchQuery(v); setPage(0) }}
              placeholder='Search name or email…'
            />
          </div>
        </FilterPanel>

        <DataTable
          columns={tableColumns}
          rows={users}
          keyExtractor={(user) => user.id}
          isLoading={isLoading}
          emptyTitle="No users found"
          emptyDescription="Try adjusting your filters."
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
